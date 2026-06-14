import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isOwnedPath, mergePackageJson } from './lib.mjs';

test('isOwnedPath: infra paths are owned', () => {
  for (const p of [
    '.github/workflows/ci.yml',
    'src/infra/auth/auth.module.ts',
    'src/config/app.config.ts',
    'src/tools/health/health.controller.ts',
    'docker-compose.yml',
    'eslint.config.mjs',
    '.env.example',
    '.claude/skills/sync-from-boilerplate/sync.mjs',
  ]) {
    assert.equal(isOwnedPath(p), true, `${p} should be owned`);
  }
});

test('isOwnedPath: excluded paths are not owned', () => {
  for (const p of [
    'src/domain/features.module.ts',
    'src/domain/todo/todo.service.ts',
    '.env',
    '.env.test',
    'uploads/avatar.png',
    '.boilerplate-sync.json',
    'pnpm-lock.yaml',
    '.claude/settings.local.json',
  ]) {
    assert.equal(isOwnedPath(p), false, `${p} should be excluded`);
  }
});

test('mergePackageJson: keeps fork identity, takes boilerplate dep bumps, preserves fork-only deps', () => {
  const fork = {
    name: 'my-product-api',
    version: '2.3.0',
    description: 'My product backend',
    scripts: { start: 'node dist/main', 'my:task': 'node tool.js' },
    dependencies: { '@nestjs/core': '11.0.0', 'my-lib': '1.0.0' },
    devDependencies: { vitest: '3.0.0' },
  };
  const boilerplate = {
    name: 'nestjs-boilerplate',
    version: '0.1.0',
    description: 'NestJS boilerplate',
    scripts: {
      start: 'node dist/main',
      'db:migrate': 'drizzle migrate',
    },
    dependencies: {
      '@nestjs/core': '11.2.0',
      'better-auth': '1.5.0',
    },
    devDependencies: { vitest: '4.1.6' },
  };

  const merged = mergePackageJson(fork, boilerplate);

  assert.equal(merged.name, 'my-product-api');
  assert.equal(merged.version, '2.3.0');
  assert.equal(merged.description, 'My product backend');
  assert.equal(merged.dependencies['@nestjs/core'], '11.2.0');
  assert.equal(merged.dependencies['better-auth'], '1.5.0');
  assert.equal(merged.dependencies['my-lib'], '1.0.0');
  assert.equal(merged.devDependencies.vitest, '4.1.6');
  assert.equal(merged.scripts['db:migrate'], 'drizzle migrate');
  assert.equal(merged.scripts['my:task'], 'node tool.js');
});

test('mergePackageJson: tolerates missing dependency blocks', () => {
  const merged = mergePackageJson(
    { name: 'fork', version: '1.0.0' },
    {
      name: 'boilerplate',
      version: '0.1.0',
      dependencies: { x: '1.0.0' },
    },
  );
  assert.equal(merged.name, 'fork');
  assert.equal(merged.dependencies.x, '1.0.0');
});
