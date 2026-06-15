# Pruning `pnpm-workspace.yaml`

`pnpm-workspace.yaml` carries four lists that accumulate stale entries as the
dependency tree moves. Every entry exists for a security reason and is annotated
with one — so the rule is **remove only what you can prove is dead, and keep the
comment's intent intact for everything you keep**. A wrong removal silently
reintroduces a CVE, which is far worse than a slightly stale list. When unsure,
leave the entry and say so.

The safety net for all of this is the same: after editing, run

```bash
pnpm install            # lockfile must still resolve; strictDepBuilds must pass
pnpm audit --audit-level high   # the regression check — compare to the baseline
```

**Capture the audit baseline first.** Before touching anything, run
`pnpm audit --audit-level high` and save the result. The test for a removal is
not "audit is clean afterward" — it's "audit shows **no advisory that wasn't
already there**". The tree can legitimately carry advisories your overrides don't
cover (a freshly-published CVE against a package nothing pins yet), so an
absolute-clean expectation will be wrong exactly when the repo most needs
attention. Reason about the **delta**, not the absolute count.

If the baseline is already dirty, that's a finding in its own right — see
"Stale pins that have themselves gone vulnerable" below — and it usually means
fixing those advisories (Part A: a new/updated override) should come *before*
pruning, so you have a clean delta to reason against.

If `pnpm install` fails, or `pnpm audit` reports a high/critical that the
baseline didn't, your removal was load-bearing. Revert that specific entry.

Inspect the working tree before/after with `git diff pnpm-workspace.yaml pnpm-lock.yaml`.

---

## 1. `minimumReleaseAgeExclude` — expired entries

`minimumReleaseAge: 43200` (30 days) blocks any package version published less
than 30 days ago. Each `minimumReleaseAgeExclude` entry (`name@version`) is a
hole punched in that wall so a specific version can install early. **Once that
version is older than 30 days, the global rule no longer blocks it, so the
exclude does nothing and can go.**

For each `name@version` entry, an entry is removable if EITHER is true:

- **Aged out**: its publish date is more than 30 days before today.
  ```bash
  pnpm view <name> time --json   # JSON map of version -> ISO publish date
  ```
  Read the `"<version>"` key; if it's >30 days ago, the exclude is dead.
- **Gone**: that exact version is no longer in `pnpm-lock.yaml`
  (`grep '<name>@<version>' pnpm-lock.yaml` finds nothing) — Dependabot moved
  the dep past it, so the exclude can never match.

Both cases are safe removals. `pnpm install` confirms nothing regressed.

---

## 2. `overrides` — stale CVE pins

Each override (e.g. `'minimatch@<3.1.3': 3.1.5`) forces anything matching the
left-hand range up to a patched version. It becomes redundant when **no package
in the tree resolves to a version matching the LHS range anymore** — the tree
already sits at or above the safe version on its own, so the pin never fires.

This is the riskiest list. Verify removal empirically rather than by eyeballing:

1. Use `pnpm why <name>` to see every version currently in the tree and who
   pulls it. If all resolved versions already fall outside the LHS range (i.e.
   are already ≥ the forced version), the override is a candidate for removal.
2. Remove the candidate, then run `pnpm install && pnpm audit --audit-level high`.
3. If the lockfile does **not** pull in a version inside the old LHS range and
   audit stays clean, the override was redundant — drop it.
4. If audit flags the package again, or the lockfile regresses to the
   vulnerable range, the override is still doing work — **revert it**.

Remove one override at a time so a regression points at a specific entry.
Entries pinned to an exact CVE-patched version with an active advisory should be
kept unless you can show the tree no longer needs them.

### Stale pins that have themselves gone vulnerable

An override pins to a "safe" version, but security is a moving target — a new
advisory can later be published against the very version you pinned to. When that
happens the override is **not** redundant (don't remove it) and **not** fine
(don't keep it as-is): the right move is to **bump it forward** to the new
patched version.

You'll spot this when the baseline `pnpm audit` flags a package that already has
an override, with a patched range *above* the pinned version — e.g. an override
forces `protobufjs` to `7.5.9` but the advisory now wants `>=7.6.1`, so the pin
is actively holding the tree on a vulnerable build. Treat it like the Part A
"Audit failed" fix: raise the override (and the matching `minimumReleaseAgeExclude`
if the new version is <30 days old) to the patched version, `pnpm install`, and
confirm `pnpm audit` clears that advisory. This is refreshing a pin, not pruning
— but it surfaces during the same baseline audit, so handle it here rather than
leaving the file in a known-vulnerable state.

---

## 3. `trustPolicyExclude` — orphaned exceptions

`trustPolicy: no-downgrade` rejects versions whose publishing-trust signals
regressed; each `trustPolicyExclude` entry (`name@version`) is a vetted
exception. An entry is dead once **that exact version is no longer in the
lockfile**:

```bash
grep -F '<name>@<version>' pnpm-lock.yaml   # no match -> orphaned, safe to remove
```

Keep entries whose version is still resolved — they're actively suppressing the
trust check for an in-use package.

---

## 4. `allowBuilds` — reconcile with packages that request builds

`strictDepBuilds: true` makes `pnpm install` **fail** if any dependency wants to
run a build (install/postinstall) script that isn't listed in `allowBuilds`. So
the list must name every build-requesting package, and the project's convention
is to set them all to `false` (builds blocked) with a one-line note on why
blocking is safe.

Reconcile in two directions:

- **Remove orphans**: an `allowBuilds` key for a package no longer present in
  `pnpm-lock.yaml` (`grep '/<name>@' pnpm-lock.yaml` finds nothing) is dead —
  remove it.
- **Add newcomers**: if `pnpm install` fails complaining about a build script
  for a package not in the list, a new dependency started requesting a build.
  This is a **security decision, not a mechanical one** — adding it to
  `allowBuilds` with `false` keeps the build blocked (the safe default) and
  unblocks the install. Investigate what the script does first (read the
  package's `scripts` field), add it as `false` with a short note matching the
  surrounding style, and call it out in your summary for human review. Only set
  `true` if the build is genuinely required and vetted — none currently are.

---

## What to report

After pruning, summarize precisely:

- entries removed, with the evidence (aged-out date / absent from lockfile /
  redundant override confirmed by clean audit)
- entries kept that looked stale but are still load-bearing, and why
- any new `allowBuilds` entries added, flagged for human review
- the result of `pnpm install` and `pnpm audit --audit-level high`

Commit `pnpm-workspace.yaml` together with the updated `pnpm-lock.yaml` — they
must move as a pair.
