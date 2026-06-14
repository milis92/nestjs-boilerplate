---
name: sync-to-boilerplate
description: Contribute a fork's infrastructure and structural improvements back UP to the upstream nestjs-boilerplate by opening a pull request. Use this whenever the user wants to upstream, contribute, push back, send, or PR fork changes to the boilerplate/template/upstream — e.g. "open a PR with my CI improvements to the boilerplate", "contribute my eslint changes upstream", "send my infra changes back to the template". This is the opposite direction of sync-from-boilerplate.
---

# Contribute fork infra changes UP to the boilerplate (via PR)

This skill runs **in a fork** of `milis92/nestjs-boilerplate`. It finds the
fork's boilerplate-owned (infra / structural) improvements, lets you pick which
to contribute, builds a clean branch off the boilerplate, and opens a PR. It is
the mirror of `sync-from-boilerplate`.

Ownership is the same denylist: only boilerplate-owned paths are eligible.
`src/domain/`, secrets, the lockfile, the sync marker, and `package.json` are
never upstreamed (`package.json` is surfaced as an advisory note instead, so
fork identity and product deps can't leak into the boilerplate).

All paths are relative to the **fork's** repo root. Requires `gh` (authenticated)
and write access to `milis92/nestjs-boilerplate`.

## How it works

1. A deterministic engine (`contribute.mjs`) discovers candidates and, later,
   assembles the chosen files onto a branch in a throwaway git worktree.
2. You curate (select what to contribute) — code finds the diffs, you decide
   what belongs upstream.
3. A subagent drafts the PR text; you confirm before anything is pushed.

## Step 1 — Discover candidates

```bash
node .claude/skills/sync-to-boilerplate/contribute.mjs discover
```

This compares fork HEAD to boilerplate HEAD over owned paths and writes
`.git/boilerplate-contrib/candidates.json` (each: `path`, `kind` of
`added`/`modified`/`removed`, and absolute `fork`/`boilerplate` temp-file paths)
plus `advisory.json` (shared `scripts`/`devDependencies` differences only).
Uncommitted changes are ignored — commit them first to include them. If there
are no candidates, stop and tell the user there's nothing to contribute.

## Step 2 — Summarize and let the user select

For each candidate, produce a one-line summary of what changed (diff the `fork`
vs `boilerplate` temp files; for `added`, summarize the new file; for `removed`,
note the deletion). Present the list and the `package.json` advisory (if any),
then ask the user which candidates to include and for a short `topic` (used as
the branch name `sync-up/<topic>`, lowercase kebab).

Do not assume — the user curates. Fork-local customizations that don't belong
upstream should be left unselected.

## Step 3 — Build the branch

Run, passing the selected paths and the topic:

```bash
node .claude/skills/sync-to-boilerplate/contribute.mjs build --topic <topic> <path1> <path2> ...
```

The engine creates `sync-up/<topic>` off `boilerplate/main` in a throwaway
worktree, applies the selected fork-HEAD file contents (or deletes, for
`removed`), commits, and prints the branch diff + the worktree path + the remote
name. It does **not** push. The fork's own working tree is untouched.

## Step 4 — Draft the PR text

Dispatch a subagent to draft the PR. Give it the branch diff (from Step 3 output)
and ask:

> Draft a pull-request title and body for contributing these infra/structural
> changes to a NestJS boilerplate. The title is one concise line. The body
> explains, per change, what it does and why it benefits the boilerplate (not
> fork-specific reasons). Keep it factual and short. Return title and body
> separately.

## Step 5 — Confirm, then push + open the PR

Show the user the branch diff and the drafted title/body. **Stop and ask for
explicit confirmation.** Only after the user says go:

```bash
git push <remote> sync-up/<topic>
gh pr create --repo milis92/nestjs-boilerplate --base main --head sync-up/<topic> \
  --title "<title>" --body "<body>"
```

`<remote>` is the remote name the engine printed (the one pointing at
`milis92/nestjs-boilerplate`). Print the PR URL that `gh` returns.

If `gh` is missing or unauthenticated, or the push is rejected (no write
access), stop and report it — do not retry blindly. (A fork-based cross-repo
flow is a possible future enhancement; it is out of scope here.)

## Step 6 — Clean up

Remove the worktree and temp files whether the PR was created or the user
aborted:

```bash
git worktree remove --force <worktree>
rm -rf .git/boilerplate-contrib
```

The local `sync-up/<topic>` branch can be deleted once pushed
(`git branch -D sync-up/<topic>`); the pushed branch on the boilerplate carries
the PR.

## Gotchas

- **Run it in the fork.** Discover compares against `boilerplate/main`.
- **Only committed fork changes are considered** (the engine reads fork HEAD).
- **`package.json` is never in the PR** — check `advisory.json` and hand-add any
  shared script/dev-tool change you want to contribute, deliberately.
- **`BOILERPLATE_REMOTE=<name>`** overrides remote detection (e.g. a local clone
  during testing).
- **Pick a fresh `topic`** — the engine refuses to clobber an existing
  `sync-up/<topic>` branch or worktree dir.
