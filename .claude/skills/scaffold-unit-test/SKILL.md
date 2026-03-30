---
name: scaffold-unit-test
description: Create unit tests for a domain service with Testcontainers and real database
---

# scaffold-unit-test

Creates `src/domain/<feature>/<features>.service.spec.ts` with:
- Test setup with TestModuleBuilder and Testcontainers
- Test data factory usage
- Tests for all CRUD methods
- Owner isolation tests

Also creates the test factory if it does not exist:
- `src/domain/<feature>/stubs/test-<feature>.factory.ts`

## Inputs

- `feature` — singular lowercase (e.g., `widget`)
- `Feature` — PascalCase (e.g., `Widget`)
- `features` — plural lowercase (e.g., `widgets`)
- `Features` — PascalCase plural (e.g., `Widgets`)

## Template: Unit test

```typescript
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest';
import { eq } from 'drizzle-orm';

import {
  TestModuleBuilder,
  TestModuleContext,
} from '@/testing/test-module.builder';
import { nonExistentId } from '@/testing/test-constants';
import { <features> } from '@/infra/drizzle/schema';
import type { UserId } from '@/infra/auth/auth.schema';

import { <Features>Module } from './<features>.module';
import { <Features>Service } from './<features>.service';
import { createTest<Feature> } from './stubs/test-<feature>.factory';

describe('<Features>Service', () => {
  let ctx: TestModuleContext;
  let service: <Features>Service;
  let testUserId: UserId;

  beforeAll(async () => {
    ctx = await TestModuleBuilder.create(<Features>Module);
    service = ctx.get(<Features>Service);
    testUserId = await ctx.auth.defaultUserId();
  }, 60_000);

  afterAll(async () => {
    await ctx.teardown();
  });

  afterEach(async () => {
    await ctx.database
      .delete(<features>)
      .where(eq(<features>.ownerId, testUserId));
  });

  // ── all ───────────────────────────────────────────────────────────

  describe('all', () => {
    it('given no <features>, returns an empty array', async () => {
      const result = await service.all(testUserId);
      expect(result).toEqual([]);
    });

    it('given multiple <features>, returns all of them', async () => {
      await createTest<Feature>(ctx.database, testUserId, {
        name: '<Feature> A',
      });
      await createTest<Feature>(ctx.database, testUserId, {
        name: '<Feature> B',
      });

      const result = await service.all(testUserId);
      expect(result).toHaveLength(2);
    });

    it('returns <features> ordered by createdAt descending', async () => {
      await createTest<Feature>(ctx.database, testUserId, {
        name: 'Older',
      });
      await createTest<Feature>(ctx.database, testUserId, {
        name: 'Newer',
      });

      const result = await service.all(testUserId);
      expect(result[0].name).toBe('Newer');
      expect(result[1].name).toBe('Older');
    });

    it('does not return <features> owned by another user', async () => {
      const otherUserId = await ctx.auth.createUser();
      await createTest<Feature>(ctx.database, otherUserId, {
        name: 'Other',
      });
      await createTest<Feature>(ctx.database, testUserId, {
        name: 'Mine',
      });

      const result = await service.all(testUserId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Mine');

      await ctx.database
        .delete(<features>)
        .where(eq(<features>.ownerId, otherUserId));
      await ctx.auth.dropUser(otherUserId);
    });
  });

  // ── single ────────────────────────────────────────────────────────

  describe('single', () => {
    it('given an existing <feature>, returns it', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
      );

      const result = await service.single(testUserId, created.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe('Test <Feature>');
    });

    it('given a non-existent id, returns null', async () => {
      const result = await service.single(
        testUserId,
        nonExistentId(),
      );
      expect(result).toBeNull();
    });

    it('does not return a <feature> owned by another user', async () => {
      const otherUserId = await ctx.auth.createUser();
      const other<Feature> = await createTest<Feature>(
        ctx.database,
        otherUserId,
      );

      const result = await service.single(testUserId, other<Feature>.id);
      expect(result).toBeNull();

      await ctx.database
        .delete(<features>)
        .where(eq(<features>.ownerId, otherUserId));
      await ctx.auth.dropUser(otherUserId);
    });
  });

  // ── create ────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a <feature> with default status', async () => {
      const result = await service.create(testUserId, {
        name: 'New <Feature>',
        description: null,
        status: 'active',
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('New <Feature>');
      expect(result.status).toBe('active');
      expect(result.owner).toBe(testUserId);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('creates a <feature> with all fields', async () => {
      const result = await service.create(testUserId, {
        name: 'Full <Feature>',
        description: 'A detailed description',
        status: 'active',
      });

      expect(result.name).toBe('Full <Feature>');
      expect(result.description).toBe('A detailed description');
    });
  });

  // ── update ────────────────────────────────────────────────────────

  describe('update', () => {
    it('partially updates a <feature> while preserving other fields', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
        {
          name: 'Original',
          description: 'Original desc',
        },
      );

      const result = await service.update(testUserId, created.id, {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
      expect(result.description).toBe('Original desc');
    });

    it('updates description to null', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
        {
          description: 'Has a description',
        },
      );

      const result = await service.update(testUserId, created.id, {
        description: null,
      });

      expect(result.description).toBeNull();
    });

    it('throws NOT_FOUND for a non-existent <feature>', async () => {
      await expect(
        service.update(testUserId, nonExistentId(), { name: 'Nope' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when updating another user <feature>', async () => {
      const otherUserId = await ctx.auth.createUser();
      const other<Feature> = await createTest<Feature>(
        ctx.database,
        otherUserId,
      );

      await expect(
        service.update(testUserId, other<Feature>.id, {
          name: 'Stolen',
        }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });

      await ctx.database
        .delete(<features>)
        .where(eq(<features>.ownerId, otherUserId));
      await ctx.auth.dropUser(otherUserId);
    });
  });

  // ── delete ────────────────────────────────────────────────────────

  describe('delete', () => {
    it('removes the <feature>', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
      );

      await service.delete(testUserId, created.id);

      const result = await service.single(testUserId, created.id);
      expect(result).toBeNull();
    });

    it('throws NOT_FOUND for a non-existent <feature>', async () => {
      await expect(
        service.delete(testUserId, nonExistentId()),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  // ── archive ───────────────────────────────────────────────────────

  describe('archive', () => {
    it('archives an active <feature>', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
        { status: 'active' },
      );

      const result = await service.archive(testUserId, created.id);
      expect(result.status).toBe('archived');
    });

    it('throws CONFLICT when <feature> is already archived', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
        { status: 'archived' },
      );

      await expect(
        service.archive(testUserId, created.id),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('throws NOT_FOUND for a non-existent <feature>', async () => {
      await expect(
        service.archive(testUserId, nonExistentId()),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  // ── restore ───────────────────────────────────────────────────────

  describe('restore', () => {
    it('restores an archived <feature>', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
        { status: 'archived' },
      );

      const result = await service.restore(testUserId, created.id);
      expect(result.status).toBe('active');
    });

    it('throws CONFLICT when <feature> is already active', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
        { status: 'active' },
      );

      await expect(
        service.restore(testUserId, created.id),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('throws NOT_FOUND for a non-existent <feature>', async () => {
      await expect(
        service.restore(testUserId, nonExistentId()),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
```

## Template: Test factory

```typescript
import type { DrizzleDatabase } from '@/infra/drizzle/drizzle.module';
import type { UserId } from '@/infra/auth/auth.schema';
import type { New<Feature>Row } from '@/infra/drizzle/types';
import { <features> } from '@/infra/drizzle/schema';

export async function createTest<Feature>(
  db: DrizzleDatabase,
  ownerId: UserId,
  overrides: Partial<New<Feature>Row> = {},
) {
  const [row] = await db
    .insert(<features>)
    .values({
      ownerId,
      name: 'Test <Feature>',
      status: 'active',
      ...overrides,
    })
    .returning();
  return row;
}
```

## Adapt the templates

- Replace all `<feature>` / `<Feature>` / `<features>` / `<Features>` with actual names.
- Adjust test data values to match the domain entity fields.
- Add/remove test cases based on whether the feature has archive/restore.
- Adjust factory default values to match required columns.

## Verify

Read `.claude/rules/unit-testing.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
