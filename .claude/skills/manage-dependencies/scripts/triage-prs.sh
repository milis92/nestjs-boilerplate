#!/usr/bin/env bash
# Triage open Dependabot PRs: classify update type + CI status, recommend an action.
#
# Why a script: classification (semver major comparison, grouped vs individual)
# and CI-rollup interpretation are deterministic. Doing them in code keeps the
# decision reproducible instead of re-derived (and occasionally mis-derived) by
# the model on every run.
#
# Output: one tab-separated row per PR plus a human-readable table on stderr.
#   number<TAB>type<TAB>checks<TAB>action<TAB>title
# where
#   type   = patch | minor | major | security | unknown
#   checks = green | failing | pending | none
#   action = MERGE   (green patch/minor/security)
#            CONFIRM  (green major — needs explicit human OK)
#            INVESTIGATE (failing checks)
#            WAIT     (checks still running)
#            REVIEW   (couldn't classify — look manually)
#
# Uses gh's built-in --jq, so no external jq dependency.
set -euo pipefail

prs=$(gh pr list --state open --author "app/dependabot" \
  --json number,title,labels,mergeable,mergeStateStatus,statusCheckRollup)

# Classify each PR. Parse JSON with python3 (always present) to stay robust.
PRS_JSON="$prs" python3 <<'PY'
import os, sys, json, re

prs = json.loads(os.environ['PRS_JSON'])
if not prs:
    sys.stderr.write("No open Dependabot PRs.\n")
    sys.exit(0)

def semver_type(title):
    # individual PR: "bump <name> from <a> to <b>"
    m = re.search(r'from\s+v?(\d+)\.(\d+)\.(\S+)\s+to\s+v?(\d+)\.(\d+)\.(\S+)', title)
    if not m:
        return None
    fa, fb = int(m.group(1)), int(m.group(2))
    ta, tb = int(m.group(4)), int(m.group(5))
    if ta != fa:
        return 'major'
    if tb != fb:
        return 'minor'
    return 'patch'

def classify(pr):
    title = pr['title'].lower()
    labels = {l['name'].lower() for l in pr.get('labels', [])}
    # GitHub security updates carry a "security" label; Dependabot version
    # updates in this repo do not.
    if 'security' in labels:
        return 'security'
    if 'patch group' in title or ('patch' in title and 'group' in title):
        return 'patch'
    if 'minor group' in title or ('minor' in title and 'group' in title):
        return 'minor'
    t = semver_type(pr['title'])
    return t if t else 'unknown'

def checks_state(pr):
    roll = pr.get('statusCheckRollup') or []
    if not roll:
        return 'none'
    concl = []
    for c in roll:
        # CheckRun has 'conclusion'+'status'; StatusContext has 'state'
        if 'conclusion' in c or 'status' in c:
            status = c.get('status')
            if status and status != 'COMPLETED':
                return 'pending'
            concl.append((c.get('conclusion') or '').upper())
        else:
            concl.append((c.get('state') or '').upper())
    if any(x in ('FAILURE', 'ERROR', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED') for x in concl):
        return 'failing'
    if any(x in ('', 'PENDING', 'EXPECTED', 'IN_PROGRESS', 'QUEUED') for x in concl):
        return 'pending'
    return 'green'

def action(typ, checks):
    if checks == 'failing':
        return 'INVESTIGATE'
    if checks == 'pending':
        return 'WAIT'
    # green or none
    if typ in ('patch', 'minor', 'security'):
        return 'MERGE'
    if typ == 'major':
        return 'CONFIRM'
    return 'REVIEW'

rows = []
for pr in prs:
    typ = classify(pr)
    checks = checks_state(pr)
    rows.append((pr['number'], typ, checks, action(typ, checks), pr['title']))

# machine-readable rows on stdout
for n, typ, checks, act, title in rows:
    sys.stdout.write(f"{n}\t{typ}\t{checks}\t{act}\t{title}\n")

# human table on stderr
w = max((len(r[4]) for r in rows), default=0)
sys.stderr.write(f"\n{'PR':>5}  {'TYPE':<8} {'CHECKS':<8} {'ACTION':<11} TITLE\n")
sys.stderr.write('-' * (40 + min(w, 60)) + '\n')
for n, typ, checks, act, title in rows:
    sys.stderr.write(f"#{n:<4} {typ:<8} {checks:<8} {act:<11} {title[:80]}\n")
sys.stderr.write('\n')
PY
