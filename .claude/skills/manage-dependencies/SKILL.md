---
name: manage-dependencies
description: >-
  Automates dependency upkeep for this repo: triages open Dependabot PRs and
  merges the safe ones, investigates and fixes red CI on dependency PRs, and
  prunes/reconciles the security lists in pnpm-workspace.yaml (overrides,
  minimumReleaseAgeExclude, trustPolicyExclude, allowBuilds). Use this whenever
  the user mentions Dependabot, dependency PRs, dependency updates, bumping or
  merging deps, "dependency maintenance", a red/failing dependency PR, or
  cleaning up / pruning pnpm-workspace.yaml — even if they don't name the skill.
---

# manage-dependencies

Keeps dependencies current and the `pnpm-workspace.yaml` security config tidy.
Two jobs that are usually run together but are independent:

- **A. Merge Dependabot PRs** — triage open PRs, merge the safe ones, fix the
  ones with red CI.
- **B. Prune `pnpm-workspace.yaml`** — remove stale security entries and
  reconcile the build allowlist.

Run both for a general "tidy up dependencies" request. Run just one when the
user is specific ("merge the dependabot PRs", "clean up pnpm-workspace.yaml").

## Operating principles

- **CI is the merge gate.** Never merge a PR whose required checks aren't green
  (verified per-PR below). Trust GitHub's checks for the merge decision — don't
  re-run the suite locally just to merge.
- **Verify workspace edits locally.** Editing `pnpm-workspace.yaml` can break the
  lockfile or reintroduce a CVE, and that won't show until install/audit. After
  any edit run `pnpm install` + `pnpm audit --audit-level high`.
- **Removal needs proof.** Every entry in `pnpm-workspace.yaml` guards against a
  specific risk. Remove an entry only when you can show it's dead; when unsure,
  keep it and say why. A stale-but-harmless entry beats a reintroduced CVE.
- **Majors and new build scripts are human calls.** Major version bumps and any
  newly build-requesting package are security/compat decisions — surface them
  for explicit confirmation, don't auto-merge or silently allow.

---

## Part A — Merge Dependabot PRs

### 1. Triage

Run the triage script — it lists every open Dependabot PR, classifies the update
type, reads the CI rollup, and recommends an action:

```bash
.claude/skills/manage-dependencies/scripts/triage-prs.sh
```

Each row is `number  type  checks  action`:

| action        | when                                   | what to do                          |
|---------------|----------------------------------------|-------------------------------------|
| `MERGE`       | green + patch / minor / security       | merge it (step 2)                   |
| `CONFIRM`     | green + **major**                      | ask the user first (step 2)         |
| `INVESTIGATE` | failing checks                         | diagnose & fix (step 3)             |
| `WAIT`        | checks still running                   | leave it; report as in-progress     |
| `REVIEW`      | couldn't classify                      | inspect with `gh pr view <n>`       |

### 2. Merge the safe ones

Patch, minor, and security PRs with green checks are safe to merge. **Major
bumps require explicit user confirmation** before merging — name the package and
the version jump and ask. The repo's default merge method is squash:

```bash
gh pr merge <number> --squash --delete-branch=false
```

If checks are green now, this merges immediately. Merge PRs one at a time and
re-run triage afterward if branches may need rebasing onto the new `main`.

### 3. Investigate & fix red CI

The goal is to get the PR green and merged, not just to report. Look at what
failed first:

```bash
gh pr checks <number>                 # which check failed
gh run view <run-id> --log-failed     # the failing log (id from the checks URL)
```

Map the failure to a fix:

- **`Audit` failed** (`pnpm audit --audit-level high`) — the new tree pulls a
  vulnerable transitive version. Read the audit output for the package + patched
  version and add/adjust an `overrides` entry in `pnpm-workspace.yaml`
  (see `references/pnpm-workspace.md`). This is the most common Dependabot
  failure here.
- **Install failed on a blocked build script** — a bumped package now requests a
  build. Add it to `allowBuilds` as `false` with a note (see the reference);
  flag it for the user.
- **`Static Analysis` / `Unit` / `E2E` failed** — a behavioral break from the
  bump (usually a minor with a breaking change, or a major). Small,
  obvious fixes (a renamed import, a moved type) are fair game; anything
  involving real logic changes is a human call — diagnose, comment the cause on
  the PR, and leave it. Don't paper over a genuine breakage to force a merge.

Apply the fix on the PR branch, then let CI re-run before merging:

```bash
gh pr checkout <number>
# … edit pnpm-workspace.yaml / code; then:
pnpm install                          # update the lockfile
pnpm audit --audit-level high         # confirm the fix locally
git commit -am "fix(deps): <what you changed and why>"
git push
gh pr merge <number> --auto --squash  # merges automatically once checks pass
```

`--auto` is right here: the fix triggers a fresh CI run, and auto-merge lands the
PR when it goes green without you babysitting it.

---

## Part B — Prune `pnpm-workspace.yaml`

**Start with the audit baseline.** Run `pnpm audit --audit-level high` and save
the result *before* editing anything. It anchors the removal-safety check
(judge each removal by whether it adds an advisory the baseline didn't, not by
absolute cleanliness) and it catches the case where an existing override now
pins to a version that has itself gone vulnerable — that pin needs **bumping
forward**, not removing (see the reference). A dirty baseline usually means you
fix those advisories first, then prune against a clean delta.

Then read `references/pnpm-workspace.md` and follow it — it has the exact
detection command and removal-safety rule for each of the four lists:

1. **`minimumReleaseAgeExclude`** — drop entries whose version is now >30 days
   old (the age block no longer applies) or no longer in the lockfile.
2. **`overrides`** — drop CVE pins the tree has outgrown, verified by a clean
   `pnpm audit` after removal. Riskiest list; remove one at a time.
3. **`trustPolicyExclude`** — drop exceptions whose version is no longer in the
   lockfile.
4. **`allowBuilds`** — remove keys for absent packages; add `false` entries for
   newly build-requesting packages (flag those for review).

After editing, the lockfile and workspace file move as a pair:

```bash
pnpm install                     # lockfile re-resolves; strictDepBuilds passes
pnpm audit --audit-level high    # must stay clean — the regression check
git diff pnpm-workspace.yaml pnpm-lock.yaml
```

If install fails or audit flags something new, the entry you removed was
load-bearing — revert that specific one.

---

## Reporting

End with a concise summary so the user can see what changed without re-checking:

- **Merged**: PR numbers + what they bumped.
- **Fixed then merged**: PR number, the failure, and the fix you pushed.
- **Awaiting confirmation**: major bumps (package + version jump) and any new
  `allowBuilds` entries.
- **Skipped**: PRs left red with a genuine break, with the cause.
- **Workspace**: entries pruned (with evidence) and entries kept-though-stale
  (with why), plus the `pnpm install` / `pnpm audit` result.

Be honest about what you didn't do — a silently skipped red PR or an unverified
removal is worse than saying "I left #N for you because X".
