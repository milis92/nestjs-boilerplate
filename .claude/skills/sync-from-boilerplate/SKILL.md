---
name: sync-from-boilerplate
description: Pull structural and infrastructure changes from the upstream nestjs-boilerplate into a project forked from it. Use this whenever the user wants to sync, update, pull, catch up on, or merge boilerplate/upstream/template infra changes into a fork — including CI, Docker, configs, tooling, dependencies, and src/infra. Use it even if the user just says "update from the boilerplate" or "what changed upstream" without naming this skill.
---

# Sync infra changes from the boilerplate into this fork

This skill runs **in a fork** of `milis92/nestjs-boilerplate`. It pulls every
boilerplate-owned (infra / structural) change since the last sync into the
fork's working tree, then stops for your review. It **never commits or pushes**.

The fork owns its features; the boilerplate owns the scaffolding. Ownership is a
denylist — everything is synced **except** `src/domain/`, `.env`/`.env.test`,
`uploads/`, `pnpm-lock.yaml`, `.claude/settings.local.json`, and the
`.boilerplate-sync.json` marker. `package.json` is field-merged so the fork's
`name`/`version`/`description` and added dependencies are never clobbered.

All paths below are relative to the **fork's** repo root.

## How it works

The split exists so the model spends judgment only where it's actually needed:

1. A deterministic Node engine (`sync.mjs`) does all git plumbing and every
   mechanical, unambiguous change — clean file updates, deletions, and the
   `package.json` field-merge. Code answers what code can answer.
2. You (the agent) reconcile only the files that changed in **both** the fork
   and the boilerplate — one subagent per conflicted file, because a textual
   diff can't tell which competing edit to keep.
3. The lockfile is regenerated and a summary is printed for review.

## Step 1 — Run the engine

```bash
node .claude/skills/sync-from-boilerplate/sync.mjs
```

The engine:
- refuses to run on a dirty working tree (commit/stash first, so the sync diff
  is the only thing under review),
- adds/uses a `boilerplate` remote for `milis92/nestjs-boilerplate` and fetches it,
- resolves a baseline: the marker's last-synced SHA → else `git merge-base` →
  else a full diff (no shared history),
- applies all **clean** changes (files the fork had not touched) straight to the
  working tree, including deletions,
- field-merges `package.json`,
- writes `.boilerplate-sync.json`,
- leaves **conflicts** for you in `.git/boilerplate-sync/conflicts.json`.

Read the printed summary and `.git/boilerplate-sync/report.json`.

## Step 2 — Reconcile conflicts (only if any)

Read `.git/boilerplate-sync/conflicts.json`. It is an array of:

```json
{ "path": "<target file>", "base": "<tmp>", "fork": "<tmp>", "boilerplate": "<tmp>", "kind": "three-way" }
```

Any of `base`/`fork`/`boilerplate` may be **null**, meaning that version does not
exist — only include the versions that are non-null when you build the prompt:

- `base` is null for `kind: "two-way"` (no common ancestor) — reconcile fork vs
  boilerplate without a base.
- `boilerplate` is null for `kind: "deleted-upstream"` (the boilerplate deleted a
  file the fork modified) — there is nothing to merge in; decide whether to keep
  the fork's file or delete it. Do not guess — surface the choice in your summary
  rather than dispatching a merge subagent.

**Dispatch one subagent per mergeable conflict, in parallel.** For each conflict,
build the prompt from the template below but **omit any line whose path is null**
(e.g. drop the BASE line for a `two-way` conflict):

> You are reconciling one file during a boilerplate→fork sync. Read these
> versions (each path that is given exists; treat any version not listed as
> absent):
> - BASE (common ancestor): `<base path>`
> - FORK (current, keep its intent): `<fork path>`
> - BOILERPLATE (upstream, bring in its improvement): `<boilerplate path>`
>
> Produce a single merged file that (1) preserves the fork's intentional
> customizations and (2) incorporates the boilerplate's change. Where they touch
> unrelated regions, take both. Where they genuinely conflict on the same intent,
> prefer the fork and note it. Write the result to `<target path>` (overwrite).
> Return a one-line note describing what you reconciled and any judgement call.

Collect each subagent's one-line note for the final report.

## Step 3 — Regenerate the lockfile (only if package.json changed)

If the engine's summary reported the `package.json` line as `field-merged`
(check `pkgChanged` in `report.json` for a reliable signal, rather than matching
the printed spacing):

```bash
pnpm install
```

This regenerates `pnpm-lock.yaml` from the merged `package.json`. If it fails,
leave the merged `package.json` in place and report the failure — do not roll back.

## Step 4 — Report and stop

Print a final summary for the user:
- counts of clean-applied / deleted / reconciled / skipped (from `report.json`),
- each reconciliation note from Step 2, clearly flagged for review,
- any `deleted-upstream` decisions awaiting their call,
- the reminder: **review `git diff`, run `pnpm lint` / `pnpm test`, then commit
  yourself** (including `.boilerplate-sync.json`). The skill committed nothing.

## Cleanup

The `.git/boilerplate-sync/` temp dir is internal scratch; it lives under `.git`
and is not tracked. Leave it or `rm -rf .git/boilerplate-sync` after committing.

## Gotchas

- **Run it in the fork, not the boilerplate.** In the boilerplate itself a sync is
  a no-op (base == head).
- **No marker on first run is normal.** The engine falls back to `git merge-base`,
  or to a full diff if there is no shared history, then writes the marker for next
  time.
- **The engine never text-merges `pnpm-lock.yaml`.** It is excluded and rebuilt by
  `pnpm install`.
- **`BOILERPLATE_REMOTE=<name>`** overrides remote auto-detection — point it at an
  existing remote when your fork named the boilerplate remote differently, or to
  sync from a local clone during testing.
