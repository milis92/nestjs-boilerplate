// Pure helpers + config for the sync-from-boilerplate skill. No I/O here.

// Paths the FORK owns — the sync never touches these. Everything else in the
// boilerplate is sync-owned (denylist model). Entries ending in '/' match a
// directory prefix; others match the exact path.
export const EXCLUDES = [
  'src/domain/', // the fork's features (showcase-only in boilerplate)
  'uploads/', // runtime artifacts
  '.env', // may hold fork secrets (.env.example IS synced)
  '.env.test',
  '.boilerplate-sync.json', // the sync marker itself
  'pnpm-lock.yaml', // never text-merged — regenerated via `pnpm install`
  '.claude/settings.local.json', // machine-local Claude settings
];

// package.json fields that always keep the FORK's value (identity).
// Dependencies are merged separately (see mergePackageJson).
export const PROTECTED_PKG_FIELDS = [
  'name',
  'version',
  'description',
];

export function isOwnedPath(path) {
  for (const ex of EXCLUDES) {
    if (ex.endsWith('/')) {
      if (path === ex.slice(0, -1) || path.startsWith(ex))
        return false;
    } else if (path === ex) {
      return false;
    }
  }
  return true;
}

const DEP_BLOCKS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

// Field-level merge: result starts from the boilerplate (so infra config and
// dep bumps flow in), then the fork's identity is restored, fork-only top-level
// keys are preserved, and dependency/script maps are unioned with the
// boilerplate winning on shared keys (to bring in version bumps) while
// fork-only entries survive.
export function mergePackageJson(fork, boilerplate) {
  const result = structuredClone(boilerplate);

  // Preserve any top-level key the fork added that the boilerplate lacks.
  for (const key of Object.keys(fork)) {
    if (!(key in result)) result[key] = structuredClone(fork[key]);
  }

  // Restore fork identity.
  for (const field of PROTECTED_PKG_FIELDS) {
    if (field in fork) result[field] = fork[field];
  }

  // Union dependency-style maps: { ...fork, ...boilerplate } => boilerplate
  // wins on shared keys (bumps), fork-only keys survive.
  for (const block of DEP_BLOCKS) {
    if (fork[block] || boilerplate[block]) {
      result[block] = {
        ...(fork[block] ?? {}),
        ...(boilerplate[block] ?? {}),
      };
    }
  }

  // Scripts: same union policy.
  if (fork.scripts || boilerplate.scripts) {
    result.scripts = {
      ...(fork.scripts ?? {}),
      ...(boilerplate.scripts ?? {}),
    };
  }

  return result;
}

// Advisory only: which shared scripts / devDependencies differ between fork and
// boilerplate. "Shared" = a key present in BOTH sides' block, so fork-only deps,
// boilerplate-only keys, and identity fields never appear. Used to hint at manual
// upstreaming; never auto-applied to a PR.
export function sharedPackageJsonAdvisory(fork, boilerplate) {
  const out = { scripts: {}, devDependencies: {} };
  for (const block of ['scripts', 'devDependencies']) {
    const f = fork[block] ?? {};
    const b = boilerplate[block] ?? {};
    for (const key of Object.keys(f)) {
      if (key in b && f[key] !== b[key]) {
        out[block][key] = { fork: f[key], boilerplate: b[key] };
      }
    }
  }
  return out;
}
