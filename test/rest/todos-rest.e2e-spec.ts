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
import type { ErrorResponse } from '@/testing/error.response';
import { NON_EXISTENT_UUID } from '@/testing/test-constants';
import { createTestTodo } from '@/domain/todos/stubs/test-todo.factory';
import type { TodoResponse } from '@/domain/todos/rest/responses/todo.response';

describe('Todos REST API', () => {
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

  // ── GET /todos ─────────────────────────────────────────────────

  describe('GET /todos', () => {
    describe('given no existing todos', () => {
      it('returns empty array', async () => {
        const client = await app.client();
        const response = await client.get('/api/todos').expect(200);
        expect(response.body).toEqual([]);
      });
    });

    describe('given existing todos', () => {
      it('returns all todos for the user', async () => {
        await createTestTodo(app.database, testUserId, {
          title: 'Alpha',
        });
        await createTestTodo(app.database, testUserId, {
          title: 'Beta',
        });

        const client = await app.client();
        const response = await client.get('/api/todos').expect(200);
        expect(response.body).toHaveLength(2);
      });
    });

    describe('given unauthenticated request', () => {
      it('returns 401', async () => {
        const client = await app.client(null);
        await client.get('/api/todos').expect(401);
      });
    });
  });

  // ── GET /todos/:id ─────────────────────────────────────────────

  describe('GET /todos/:id', () => {
    it('returns the todo', async () => {
      const row = await createTestTodo(app.database, testUserId, {
        title: 'My Todo',
      });

      const client = await app.client();
      const response = await client
        .get(`/api/todos/${row.id}`)
        .expect(200);

      const body = response.body as TodoResponse;
      expect(body.title).toBe('My Todo');
    });

    it('returns 404 for non-existent ID', async () => {
      const client = await app.client();
      const response = await client
        .get(`/api/todos/${NON_EXISTENT_UUID}`)
        .expect(404);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(404);
    });

    it('returns 400 for invalid UUID', async () => {
      const client = await app.client();
      await client.get('/api/todos/not-a-uuid').expect(400);
    });
  });

  // ── POST /todos ────────────────────────────────────────────────

  describe('POST /todos', () => {
    describe('given a valid request', () => {
      it('creates and returns the todo', async () => {
        const client = await app.client();
        const response = await client
          .post('/api/todos')
          .send({ title: 'New Todo' })
          .expect(201);

        const body = response.body as TodoResponse;
        expect(body.title).toBe('New Todo');
        expect(body.id).toBeDefined();
      });
    });

    describe('given an invalid request body', () => {
      it('returns 422 for missing required fields', async () => {
        const client = await app.client();
        await client.post('/api/todos').send({}).expect(422);
      });
    });
  });

  // ── PATCH /todos/:id ───────────────────────────────────────────

  describe('PATCH /todos/:id', () => {
    it('updates and returns the todo', async () => {
      const row = await createTestTodo(app.database, testUserId);

      const client = await app.client();
      const response = await client
        .patch(`/api/todos/${row.id}`)
        .send({ title: 'Updated' })
        .expect(200);

      const body = response.body as TodoResponse;
      expect(body.title).toBe('Updated');
    });

    it('returns 404 for non-existent todo', async () => {
      const client = await app.client();
      await client
        .patch(`/api/todos/${NON_EXISTENT_UUID}`)
        .send({ title: 'X' })
        .expect(404);
    });
  });

  // ── DELETE /todos/:id ──────────────────────────────────────────

  describe('DELETE /todos/:id', () => {
    it('deletes the todo and returns 204', async () => {
      const row = await createTestTodo(app.database, testUserId);

      const client = await app.client();
      await client.delete(`/api/todos/${row.id}`).expect(204);

      // Verify deletion
      await client.get(`/api/todos/${row.id}`).expect(404);
    });

    it('returns 404 for non-existent todo', async () => {
      const client = await app.client();
      await client
        .delete(`/api/todos/${NON_EXISTENT_UUID}`)
        .expect(404);
    });
  });
});
