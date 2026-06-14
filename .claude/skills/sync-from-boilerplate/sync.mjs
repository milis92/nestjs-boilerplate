#!/usr/bin/env node
// Deterministic engine for the sync-from-boilerplate skill.
//
// Run from the FORK repo root. It fetches the boilerplate, resolves a baseline
// SHA, diffs the boilerplate-owned paths, applies clean changes and the
// package.json field-merge directly to the working tree, and writes conflict
// triples (base/fork/boilerplate) for the orchestrator's subagents to merge.
//
// Outputs (under .git/boilerplate-sync/):
//   report.json     — machine-readable summary
//   conflicts.json  — [{ path, base, fork, boilerplate }] temp-file paths
// Also prints a human summary to stdout. Never commits or pushes.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import {
  isOwnedPath,
  mergePackageJson,
  PROTECTED_PKG_FIELDS,
} from './lib.mjs';

const BOILERPLATE_URL = 'git@github.com:milis92/nestjs-boilerplate';
const BOILERPLATE_SLUG = 'milis92/nestjs-boilerplate';
const MARKER = '.boilerplate-sync.json';
const TMP = '.git/boilerplate-sync';

function git(args, opts = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    ...opts,
  }).trim();
}
function gitOk(args) {
  // Calls execFileSync directly, not git(): with stdout ignored execFileSync
  // returns null and git()'s .trim() throws on it, which would make gitOk
  // always report false. We only care whether the command exited zero.
  try {
    execFileSync('git', args, {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}
function fileAt(rev, path) {
  try {
    return execFileSync('git', ['show', `${rev}:${path}`], {
      encoding: 'utf8',
    });
  } catch {
    return null;
  }
}
function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

// 1. Guard: clean working tree.
if (git(['status', '--porcelain'])) {
  fail(
    'Working tree is not clean. Commit or stash your changes first, so the sync diff is the only thing under review.',
  );
}

// 2. Locate & fetch the boilerplate remote.
// BOILERPLATE_REMOTE env var overrides auto-detection — name an existing remote
// to sync from. Lets forks that named the remote differently, and the rehearsal
// (a local clone), drive the engine without touching GitHub.
function ensureRemote() {
  const remotes = git(['remote']).split('\n').filter(Boolean);
  const override = process.env.BOILERPLATE_REMOTE;
  if (override) {
    if (!remotes.includes(override)) {
      fail(
        `BOILERPLATE_REMOTE='${override}' is not an existing git remote.`,
      );
    }
    tryFetch(override);
    return override;
  }
  for (const r of remotes) {
    const url = git(['remote', 'get-url', r]);
    if (url.includes(BOILERPLATE_SLUG)) {
      tryFetch(r);
      return r;
    }
  }
  const name = 'boilerplate';
  if (!remotes.includes(name))
    git(['remote', 'add', name, BOILERPLATE_URL]);
  tryFetch(name);
  return name;
}
function tryFetch(remote) {
  try {
    git(['fetch', remote, '--quiet']);
  } catch {
    fail(
      `Could not fetch from '${remote}'. Check network access and your permission to ${BOILERPLATE_SLUG}.`,
    );
  }
}
const remote = ensureRemote();
const ref = `${remote}/main`;
if (!gitOk(['rev-parse', '--verify', ref]))
  fail(`Ref '${ref}' not found after fetch.`);
const head = git(['rev-parse', ref]);

// 3. Resolve baseline SHA: marker -> merge-base -> none.
function baselineSha() {
  if (existsSync(MARKER)) {
    try {
      const m = JSON.parse(readFileSync(MARKER, 'utf8'));
      if (
        m.lastSyncedSha &&
        gitOk(['cat-file', '-e', `${m.lastSyncedSha}^{commit}`])
      ) {
        return m.lastSyncedSha;
      }
    } catch {
      /* fall through */
    }
  }
  try {
    return git(['merge-base', 'HEAD', ref]);
  } catch {
    return null;
  }
}
const base = baselineSha();

// 4. Compute changed owned paths (base..ref). No base => everything in ref.
let entries; // [{ status, path }]
if (base) {
  entries = git([
    'diff',
    '--name-status',
    '--no-renames',
    `${base}..${ref}`,
  ])
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, path] = line.split('\t');
      return { status: status[0], path };
    });
} else {
  entries = git(['ls-tree', '-r', '--name-only', ref])
    .split('\n')
    .filter(Boolean)
    .map((path) => ({ status: 'A', path }));
}
entries = entries.filter((e) => isOwnedPath(e.path));

// 5. Classify + apply.
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const cleanApplied = [];
const cleanDeleted = [];
const skipped = [];
const conflicts = []; // for conflicts.json
let pkgChanged = false;

function writeWorkingTree(path, content) {
  mkdirSync(dirname(path) || '.', { recursive: true });
  writeFileSync(path, content);
}
function writeTmp(path, suffix, content) {
  if (content == null) return null;
  const p = join(TMP, `${path}.${suffix}`);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
  return p;
}

for (const { status, path } of entries) {
  const baseV = base ? fileAt(base, path) : null;
  const forkV = fileAt('HEAD', path);
  const boilerV = fileAt(ref, path);

  // Special handler: package.json (field-level merge, identity protected).
  if (path === 'package.json') {
    if (forkV == null) {
      // fork has no package.json — just take boilerplate's
      if (boilerV != null) {
        writeWorkingTree(path, boilerV);
        cleanApplied.push(path);
      }
      continue;
    }
    if (boilerV == null) {
      skipped.push({ path, why: 'deleted in boilerplate' });
      continue;
    }
    const merged = mergePackageJson(
      JSON.parse(forkV),
      JSON.parse(boilerV),
    );
    const serialized = `${JSON.stringify(merged, null, 2)}\n`;
    if (serialized !== forkV) {
      writeWorkingTree(path, serialized);
      pkgChanged = true;
    } else skipped.push({ path, why: 'no change after merge' });
    continue;
  }

  if (status === 'D') {
    if (forkV == null) {
      skipped.push({ path, why: 'already absent' });
      continue;
    }
    if (base && forkV === baseV) {
      rmSync(path, { force: true });
      cleanDeleted.push(path);
    } else {
      // fork modified a file the boilerplate deleted — needs human judgment
      conflicts.push({
        path,
        base: writeTmp(path, 'base', baseV),
        fork: writeTmp(path, 'fork', forkV),
        boilerplate: null,
        kind: 'deleted-upstream',
      });
    }
    continue;
  }

  // A / M
  if (forkV == null) {
    writeWorkingTree(path, boilerV);
    cleanApplied.push(path);
    continue;
  }
  if (forkV === boilerV) {
    skipped.push({ path, why: 'already identical' });
    continue;
  }
  if (base && forkV === baseV) {
    writeWorkingTree(path, boilerV);
    cleanApplied.push(path);
    continue;
  }

  // Both diverged => conflict for an agent to reconcile.
  conflicts.push({
    path,
    base: writeTmp(path, 'base', baseV),
    fork: writeTmp(path, 'fork', forkV),
    boilerplate: writeTmp(path, 'boilerplate', boilerV),
    kind: base ? 'three-way' : 'two-way',
  });
}

// 6. Write marker (reflects the boilerplate HEAD we synced against).
writeFileSync(
  MARKER,
  `${JSON.stringify(
    {
      lastSyncedSha: head,
      lastSyncedDate: new Date().toISOString(),
      boilerplateRemote: remote,
    },
    null,
    2,
  )}\n`,
);

// 7. Emit machine outputs + human summary.
const report = {
  base,
  head,
  remote,
  pkgChanged,
  cleanApplied,
  cleanDeleted,
  skipped,
  conflicts: conflicts.map((c) => ({ path: c.path, kind: c.kind })),
};
writeFileSync(
  join(TMP, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);
writeFileSync(
  join(TMP, 'conflicts.json'),
  `${JSON.stringify(conflicts, null, 2)}\n`,
);

const baseLabel = base
  ? base.slice(0, 8)
  : '(no common ancestor — full diff)';
console.log(
  `\nsync-from-boilerplate: ${remote} ${baseLabel} -> ${head.slice(0, 8)}\n`,
);
console.log(`  clean applied : ${cleanApplied.length}`);
console.log(`  clean deleted : ${cleanDeleted.length}`);
console.log(
  `  package.json  : ${pkgChanged ? 'field-merged' : 'unchanged'}`,
);
console.log(`  conflicts     : ${conflicts.length}`);
console.log(`  skipped       : ${skipped.length}`);
if (conflicts.length) {
  console.log('\n  Conflicts needing reconciliation:');
  for (const c of conflicts)
    console.log(`    - ${c.path} [${c.kind}]`);
}
console.log(`\n  Details: ${join(TMP, 'report.json')}`);
console.log(`  Conflict triples: ${join(TMP, 'conflicts.json')}`);
console.log(`  Marker written: ${MARKER}`);
if (PROTECTED_PKG_FIELDS && pkgChanged) {
  console.log(
    '  (package.json identity fields preserved: ' +
      PROTECTED_PKG_FIELDS.join(', ') +
      ')',
  );
}
