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
import { widgets } from '@/infra/drizzle/schema';
import type { ErrorResponse } from '@/testing/error.response';
import { NON_EXISTENT_UUID } from '@/testing/test-constants';
import { createTestWidget } from '@/domain/widget/stubs/test-widget.factory';
import type { WidgetResponse } from '@/domain/widget/rest/responses/widget.response';

describe('Widgets REST API', () => {
  let app: TestApplicationContext;
  let testUserId: string;

  beforeAll(async () => {
    app = await TestApplicationContext.create();
    testUserId = await app.auth.defaultUserId();
  }, 120000);

  afterAll(async () => {
    await app.teardown();
  });

  afterEach(async () => {
    await app.database
      .delete(widgets)
      .where(eq(widgets.ownerId, testUserId));
  });

  // ── GET /widgets ────────────────────────────────────────────────

  describe('GET /widgets', () => {
    describe('given no existing widgets', () => {
      it('returns empty array', async () => {
        const client = await app.client();
        const response = await client.get('/api/widgets').expect(200);
        expect(response.body).toEqual([]);
      });
    });

    describe('given existing widgets', () => {
      it('returns all widgets for the user', async () => {
        await createTestWidget(app.database, testUserId, {
          name: 'Alpha',
        });
        await createTestWidget(app.database, testUserId, {
          name: 'Beta',
        });

        const client = await app.client();
        const response = await client.get('/api/widgets').expect(200);
        expect(response.body).toHaveLength(2);
      });
    });
  });

  // ── GET /widgets/:id ────────────────────────────────────────────

  describe('GET /widgets/:id', () => {
    it('returns the widget', async () => {
      const row = await createTestWidget(app.database, testUserId, {
        name: 'My Widget',
      });

      const client = await app.client();
      const response = await client
        .get(`/api/widgets/${row.id}`)
        .expect(200);

      const body = response.body as WidgetResponse;
      expect(body.name).toBe('My Widget');
    });

    it('returns 404 for non-existent ID', async () => {
      const client = await app.client();
      const response = await client
        .get(`/api/widgets/${NON_EXISTENT_UUID}`)
        .expect(404);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(404);
    });
  });

  // ── POST /widgets ───────────────────────────────────────────────

  describe('POST /widgets', () => {
    describe('given a valid request', () => {
      it('creates and returns the widget with default status', async () => {
        const client = await app.client();
        const response = await client
          .post('/api/widgets')
          .send({ name: 'New Widget' })
          .expect(201);

        const body = response.body as WidgetResponse;
        expect(body.name).toBe('New Widget');
        expect(body.status).toBe('active');
        expect(body.id).toBeDefined();
      });
    });

    describe('given an invalid request body', () => {
      it('returns 422 for missing required fields', async () => {
        const client = await app.client();
        await client.post('/api/widgets').send({}).expect(422);
      });
    });
  });

  // ── PATCH /widgets/:id ──────────────────────────────────────────

  describe('PATCH /widgets/:id', () => {
    it('updates and returns the widget', async () => {
      const row = await createTestWidget(app.database, testUserId);

      const client = await app.client();
      const response = await client
        .patch(`/api/widgets/${row.id}`)
        .send({ name: 'Updated' })
        .expect(200);

      const body = response.body as WidgetResponse;
      expect(body.name).toBe('Updated');
    });

    it('returns 404 for non-existent widget', async () => {
      const client = await app.client();
      await client
        .patch(`/api/widgets/${NON_EXISTENT_UUID}`)
        .send({ name: 'X' })
        .expect(404);
    });
  });

  // ── DELETE /widgets/:id ─────────────────────────────────────────

  describe('DELETE /widgets/:id', () => {
    it('deletes the widget and returns 204', async () => {
      const row = await createTestWidget(app.database, testUserId);

      const client = await app.client();
      await client.delete(`/api/widgets/${row.id}`).expect(204);

      // Verify deletion
      await client.get(`/api/widgets/${row.id}`).expect(404);
    });

    it('returns 404 for non-existent widget', async () => {
      const client = await app.client();
      await client
        .delete(`/api/widgets/${NON_EXISTENT_UUID}`)
        .expect(404);
    });
  });
});
