import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest';
import { eq } from 'drizzle-orm';

import { TestApplicationContext } from '../test-application.context';
import { todos } from '@/infra/drizzle/schema';
import { NON_EXISTENT_UUID } from '@/testing/test-constants';
import { createTestTodo } from '@/domain/todos/stubs/test-todo.factory';

describe('Todos GraphQL API', () => {
  let app: TestApplicationContext;
  let testUserId: string;

  beforeAll(async () => {
    app = await TestApplicationContext.create();
    testUserId = await app.auth.defaultUserId();
  }, 120_000);

  afterAll(async () => {
    await app.teardown();
  });

  afterEach(async () => {
    await app.database
      .delete(todos)
      .where(eq(todos.ownerId, testUserId));
  });

  // ── Query: todos ───────────────────────────────────────────────

  describe('Query: todos', () => {
    it('returns empty array when no todos exist', async () => {
      const result = await app.executeGraphql<{
        todos: { id: string; title: string }[];
      }>({
        query: `query { todos { id title } }`,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.todos).toEqual([]);
    });

    it('returns all todos for the user', async () => {
      await createTestTodo(app.database, testUserId, {
        title: 'Alpha',
      });
      await createTestTodo(app.database, testUserId, {
        title: 'Beta',
      });

      const result = await app.executeGraphql<{
        todos: { id: string; title: string }[];
      }>({
        query: `query { todos { id title } }`,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.todos).toHaveLength(2);
    });
  });

  // ── Query: todo ────────────────────────────────────────────────

  describe('Query: todo', () => {
    it('returns a single todo', async () => {
      const row = await createTestTodo(app.database, testUserId, {
        title: 'My Todo',
      });

      const result = await app.executeGraphql<{
        todo: { id: string; title: string };
      }>({
        query: `query Todo($id: ID!) { todo(id: $id) { id title } }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.todo.title).toBe('My Todo');
    });

    it('returns error for non-existent ID', async () => {
      const result = await app.executeGraphql<{
        todo: { id: string };
      }>({
        query: `query Todo($id: ID!) { todo(id: $id) { id } }`,
        variables: { id: NON_EXISTENT_UUID },
      });

      expect(result.errors).toBeDefined();
    });
  });

  // ── Mutation: createTodo ───────────────────────────────────────

  describe('Mutation: createTodo', () => {
    describe('given valid input', () => {
      it('creates and returns the todo', async () => {
        const result = await app.executeGraphql<{
          createTodo: { id: string; title: string };
        }>({
          query: `mutation CreateTodo($input: CreateTodoInput!) {
            createTodo(input: $input) { id title }
          }`,
          variables: { input: { title: 'New Todo' } },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.createTodo.title).toBe('New Todo');
        expect(result.data?.createTodo.id).toBeDefined();
      });
    });
  });

  // ── Mutation: updateTodo ───────────────────────────────────────

  describe('Mutation: updateTodo', () => {
    it('updates and returns the todo', async () => {
      const row = await createTestTodo(app.database, testUserId, {
        title: 'Original',
      });

      const result = await app.executeGraphql<{
        updateTodo: { title: string };
      }>({
        query: `mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {
          updateTodo(id: $id, input: $input) { title }
        }`,
        variables: { id: row.id, input: { title: 'Updated' } },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.updateTodo.title).toBe('Updated');
    });

    it('returns error for non-existent todo', async () => {
      const result = await app.executeGraphql<{
        updateTodo: { id: string };
      }>({
        query: `mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {
          updateTodo(id: $id, input: $input) { id }
        }`,
        variables: {
          id: NON_EXISTENT_UUID,
          input: { title: 'X' },
        },
      });

      expect(result.errors).toBeDefined();
    });
  });

  // ── Mutation: deleteTodo ───────────────────────────────────────

  describe('Mutation: deleteTodo', () => {
    it('deletes the todo and returns true', async () => {
      const row = await createTestTodo(app.database, testUserId);

      const result = await app.executeGraphql<{
        deleteTodo: boolean;
      }>({
        query: `mutation DeleteTodo($id: ID!) { deleteTodo(id: $id) }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.deleteTodo).toBe(true);
    });

    it('returns error for non-existent todo', async () => {
      const result = await app.executeGraphql<{
        deleteTodo: boolean;
      }>({
        query: `mutation DeleteTodo($id: ID!) { deleteTodo(id: $id) }`,
        variables: { id: NON_EXISTENT_UUID },
      });

      expect(result.errors).toBeDefined();
    });
  });
});
