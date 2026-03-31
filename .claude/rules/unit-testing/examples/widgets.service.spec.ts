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
import { widgets } from '@/infra/drizzle/schema';
import type { UserId } from '@/infra/auth/auth.schema';

import { WidgetsModule } from './widgets.module';
import { WidgetsService } from './widgets.service';
import { createTestWidget } from './stubs/test-widget.factory';

describe('WidgetsService', () => {
  let ctx: TestModuleContext;
  let service: WidgetsService;
  let testUserId: UserId;

  beforeAll(async () => {
    ctx = await TestModuleBuilder.create(WidgetsModule);
    service = ctx.get(WidgetsService);
    testUserId = await ctx.auth.defaultUserId();
  }, 60_000);

  afterAll(async () => {
    await ctx.teardown();
  });

  afterEach(async () => {
    await ctx.database
      .delete(widgets)
      .where(eq(widgets.ownerId, testUserId));
  });

  // ── all ───────────────────────────────────────────────────────────

  describe('all', () =>
  {
    it('given no widgets, returns an empty array', async () => {
      const result = await service.all(testUserId);
      expect(result).toEqual([]);
    });

    it('given multiple widgets, returns all of them', async () => {
      await createTestWidget(ctx.database, testUserId, {
        name: 'Widget A',
      });
      await createTestWidget(ctx.database, testUserId, {
        name: 'Widget B',
      });

      const result = await service.all(testUserId);
      expect(result).toHaveLength(2);
    });

    it('does not return widgets owned by another user', async () => {
      const otherUserId = await ctx.auth.createUser();
      await createTestWidget(ctx.database, otherUserId, {
        name: 'Other',
      });
      await createTestWidget(ctx.database, testUserId, {
        name: 'Mine',
      });

      const result = await service.all(testUserId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Mine');

      await ctx.database
        .delete(widgets)
        .where(eq(widgets.ownerId, otherUserId));
      await ctx.auth.dropUser(otherUserId);
    });
  });

  // ── single ────────────────────────────────────────────────────────

  describe('single', () => {
    it('given an existing widget, returns it', async () => {
      const created = await createTestWidget(
        ctx.database,
        testUserId,
      );

      const result = await service.single(testUserId, created.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe('Test Widget');
    });

    it('given a non-existent id, returns null', async () => {
      const result = await service.single(
        testUserId,
        nonExistentId(),
      );
      expect(result).toBeNull();
    });
  });

  // ── create ────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a widget with default status', async () => {
      const result = await service.create(testUserId, {
        name: 'New Widget',
        description: null,
        status: 'active',
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('New Widget');
      expect(result.status).toBe('active');
      expect(result.owner).toBe(testUserId);
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  // ── update ────────────────────────────────────────────────────────

  describe('update', () => {
    it('partially updates a widget while preserving other fields', async () => {
      const created = await createTestWidget(
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

    it('throws NOT_FOUND for a non-existent widget', async () => {
      await expect(
        service.update(testUserId, nonExistentId(), { name: 'Nope' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  // ── delete ────────────────────────────────────────────────────────

  describe('delete', () => {
    it('removes the widget', async () => {
      const created = await createTestWidget(
        ctx.database,
        testUserId,
      );

      await service.delete(testUserId, created.id);

      const result = await service.single(testUserId, created.id);
      expect(result).toBeNull();
    });

    it('throws NOT_FOUND for a non-existent widget', async () => {
      await expect(
        service.delete(testUserId, nonExistentId()),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
