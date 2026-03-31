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
import { todos } from '@/infra/drizzle/schema';
import type { UserId } from '@/infra/auth/auth.schema';

import { TodosModule } from './todos.module';
import { TodosService } from './todos.service';
import { createTestTodo } from './stubs/test-todo.factory';

describe('TodosService', () => {
  let ctx: TestModuleContext;
  let service: TodosService;
  let testUserId: UserId;

  beforeAll(async () => {
    ctx = await TestModuleBuilder.create(TodosModule);
    service = ctx.get(TodosService);
    testUserId = await ctx.auth.defaultUserId();
  }, 60_000);

  afterAll(async () => {
    await ctx.teardown();
  });

  afterEach(async () => {
    await ctx.database
      .delete(todos)
      .where(eq(todos.ownerId, testUserId));
  });

  // ── all ───────────────────────────────────────────────────────────

  describe('all', () => {
    it('given no todos, returns an empty array', async () => {
      const result = await service.all(testUserId);
      expect(result).toEqual([]);
    });

    it('given multiple todos, returns all of them', async () => {
      await createTestTodo(ctx.database, testUserId, {
        title: 'Todo A',
      });
      await createTestTodo(ctx.database, testUserId, {
        title: 'Todo B',
      });

      const result = await service.all(testUserId);
      expect(result).toHaveLength(2);
    });

    it('does not return todos owned by another user', async () => {
      const otherUserId = await ctx.auth.createUser();
      await createTestTodo(ctx.database, otherUserId, {
        title: 'Other',
      });
      await createTestTodo(ctx.database, testUserId, {
        title: 'Mine',
      });

      const result = await service.all(testUserId);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Mine');

      await ctx.database
        .delete(todos)
        .where(eq(todos.ownerId, otherUserId));
      await ctx.auth.dropUser(otherUserId);
    });
  });

  // ── single ────────────────────────────────────────────────────────

  describe('single', () => {
    it('given an existing todo, returns it', async () => {
      const created = await createTestTodo(ctx.database, testUserId);

      const result = await service.single(testUserId, created.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.title).toBe('Test Todo');
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
    it('creates a todo and returns the domain model', async () => {
      const result = await service.create(testUserId, {
        title: 'New Todo',
      });

      expect(result.id).toBeDefined();
      expect(result.title).toBe('New Todo');
      expect(result.owner).toBe(testUserId);
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  // ── update ────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates the title', async () => {
      const created = await createTestTodo(ctx.database, testUserId, {
        title: 'Original',
      });

      const result = await service.update(testUserId, created.id, {
        title: 'Updated',
      });

      expect(result.title).toBe('Updated');
    });

    it('throws NOT_FOUND for a non-existent todo', async () => {
      await expect(
        service.update(testUserId, nonExistentId(), {
          title: 'Nope',
        }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  // ── delete ────────────────────────────────────────────────────────

  describe('delete', () => {
    it('removes the todo', async () => {
      const created = await createTestTodo(ctx.database, testUserId);

      await service.delete(testUserId, created.id);

      const result = await service.single(testUserId, created.id);
      expect(result).toBeNull();
    });

    it('throws NOT_FOUND for a non-existent todo', async () => {
      await expect(
        service.delete(testUserId, nonExistentId()),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
