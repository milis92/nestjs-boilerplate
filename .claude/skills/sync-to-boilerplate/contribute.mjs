#!/usr/bin/env node
// Deterministic engine for the sync-to-boilerplate skill.
//
// Run from the FORK repo root. Two phases:
//   discover  — diff fork HEAD vs boilerplate HEAD over owned paths; emit the
//               candidate set (+ a package.json advisory). Changes nothing.
//   build     — given a selection + --topic, assemble the selected files onto a
//               sync-up/<topic> branch in a THROWAWAY git worktree based at
//               boilerplate HEAD. Does NOT push. The orchestrator pushes + PRs.
//
// Outputs (under .git/boilerplate-contrib/):
//   candidates.json — [{ path, kind, fork, boilerplate }] (absolute temp paths)
//   advisory.json   — { scripts:{...}, devDependencies:{...} } shared-key diffs
// Never commits to the fork's branch, never pushes.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import {
  isOwnedPath,
  sharedPackageJsonAdvisory,
} from '../sync-from-boilerplate/lib.mjs';

const BOILERPLATE_URL = 'git@github.com:milis92/nestjs-boilerplate';
const BOILERPLATE_SLUG = 'milis92/nestjs-boilerplate';
const TMP = '.git/boilerplate-contrib';

function git(args, opts = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    ...opts,
  }).trim();
}
function gitOk(args) {
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
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}
function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
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
function ensureRemote() {
  const remotes = git(['remote']).split('\n').filter(Boolean);
  const override = process.env.BOILERPLATE_REMOTE;
  if (override) {
    if (!remotes.includes(override))
      fail(
        `BOILERPLATE_REMOTE='${override}' is not an existing git remote.`,
      );
    tryFetch(override);
    return override;
  }
  for (const r of remotes) {
    if (git(['remote', 'get-url', r]).includes(BOILERPLATE_SLUG)) {
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

function writeTmp(path, suffix, content) {
  if (content == null) return null;
  const p = join(TMP, `${path}.${suffix}`);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
  return resolve(p);
}

const phase = process.argv[2];
if (phase !== 'discover' && phase !== 'build') {
  fail(
    'usage: contribute.mjs <discover|build> [--topic <name>] [paths...]',
  );
}

const remote = ensureRemote();
const ref = `${remote}/main`;
if (!gitOk(['rev-parse', '--verify', ref]))
  fail(`Ref '${ref}' not found after fetch.`);

if (phase === 'discover') {
  if (git(['status', '--porcelain'])) {
    console.error(
      '⚠ Uncommitted changes are ignored; commit them to include. Proceeding from HEAD.',
    );
  }

  // Diff direction ref..HEAD: A = in fork not boilerplate, D = in boilerplate
  // not fork, M = modified. pnpm-lock + marker are already filtered by
  // isOwnedPath; package.json is dropped explicitly (advisory handles it).
  const entries = git([
    'diff',
    '--name-status',
    '--no-renames',
    `${ref}..HEAD`,
  ])
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [s, p] = line.split('\t');
      return { status: s[0], path: p };
    })
    .filter((e) => isOwnedPath(e.path) && e.path !== 'package.json');

  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  const candidates = entries.map(({ status, path }) => {
    const kind =
      status === 'A'
        ? 'added'
        : status === 'D'
          ? 'removed'
          : 'modified';
    return {
      path,
      kind,
      fork: writeTmp(path, 'fork', fileAt('HEAD', path)),
      boilerplate: writeTmp(path, 'boilerplate', fileAt(ref, path)),
    };
  });

  let advisory = { scripts: {}, devDependencies: {} };
  const forkPkg = fileAt('HEAD', 'package.json');
  const bpPkg = fileAt(ref, 'package.json');
  if (forkPkg && bpPkg && forkPkg !== bpPkg) {
    advisory = sharedPackageJsonAdvisory(
      JSON.parse(forkPkg),
      JSON.parse(bpPkg),
    );
  }

  writeFileSync(
    join(TMP, 'candidates.json'),
    `${JSON.stringify(candidates, null, 2)}\n`,
  );
  writeFileSync(
    join(TMP, 'advisory.json'),
    `${JSON.stringify(advisory, null, 2)}\n`,
  );

  const advCount =
    Object.keys(advisory.scripts).length +
    Object.keys(advisory.devDependencies).length;
  console.log(
    `\nsync-to-boilerplate (discover): fork HEAD vs ${ref}\n`,
  );
  console.log(`  candidates : ${candidates.length}`);
  for (const c of candidates)
    console.log(`    - ${c.path} [${c.kind}]`);
  console.log(`  package.json advisory entries: ${advCount}`);
  console.log(`\n  Candidates: ${join(TMP, 'candidates.json')}`);
  console.log(`  Advisory:   ${join(TMP, 'advisory.json')}`);
  if (!candidates.length)
    console.log(
      '\n  Nothing to contribute — fork has no owned changes beyond upstream.',
    );
  process.exit(0);
}

// phase === 'build'
const args = process.argv.slice(3);
let topic = null;
const selected = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--topic') {
    topic = args[++i];
  } else {
    selected.push(args[i]);
  }
}
if (!topic) fail('build requires --topic <name>');
if (!selected.length)
  fail('build requires at least one selected path');
if (!/^[a-z0-9][a-z0-9._-]*$/i.test(topic))
  fail(`invalid --topic '${topic}' (use letters, digits, . _ -)`);

const branch = `sync-up/${topic}`;
if (gitOk(['rev-parse', '--verify', branch]))
  fail(
    `Branch '${branch}' already exists. Choose a different --topic.`,
  );

const candPath = join(TMP, 'candidates.json');
if (!existsSync(candPath))
  fail('No candidates.json — run `contribute.mjs discover` first.');
const byPath = new Map(
  JSON.parse(readFileSync(candPath, 'utf8')).map((c) => [c.path, c]),
);

const worktree = join(tmpdir(), `sync-up-${topic}`);
if (existsSync(worktree))
  fail(
    `Worktree dir '${worktree}' already exists; remove it or choose another --topic.`,
  );
git(['worktree', 'add', '-b', branch, worktree, ref]);

for (const path of selected) {
  const c = byPath.get(path);
  if (!c) {
    git(['worktree', 'remove', '--force', worktree]);
    fail(`Selected path not in candidates: ${path}`);
  }
  if (c.kind === 'removed') {
    execFileSync('git', ['-C', worktree, 'rm', '--quiet', path]);
  } else {
    const content = fileAt('HEAD', path); // fork-HEAD content, read from the fork repo
    const dest = join(worktree, path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, content);
    execFileSync('git', ['-C', worktree, 'add', path]);
  }
}

execFileSync('git', [
  '-C',
  worktree,
  'commit',
  '--quiet',
  '-m',
  `sync-up: ${topic}`,
]);

console.log(
  `\nsync-to-boilerplate (build): ${branch} based at ${ref}\n`,
);
console.log(
  git(['-C', worktree, 'diff', `${ref}..${branch}`]) || '  (no diff)',
);
console.log(`\n  worktree : ${worktree}`);
console.log(`  branch   : ${branch}`);
console.log(`  remote   : ${remote}`);
console.log('\n  Next (orchestrator, after confirmation):');
console.log(`    git push ${remote} ${branch}`);
console.log(
  `    gh pr create --repo ${BOILERPLATE_SLUG} --base main --head ${branch} --title <title> --body <body>`,
);
console.log(`  Cleanup: git worktree remove --force ${worktree}`);
process.exit(0);
