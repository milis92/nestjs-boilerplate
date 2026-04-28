import { eq } from 'drizzle-orm';

import { TestApplicationContext } from '../test-application.context';
import { widgets } from '@/infra/drizzle/schema';
import type { ErrorResponse } from '@/testing/error.response';
import { NON_EXISTENT_UUID } from '@/testing/test-constants';
import { createTestWidget } from '@/domain/widgets/stubs/test-widget.factory';
import type { WidgetResponse } from '@/domain/widgets/rest/responses/widget.response';

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

  describe('GET /api/widgets/:id', () => {
    describe('given an existing widget', () => {
      it('returns the widget', async () => {
        const row = await createTestWidget(app.database, testUserId, {
          name: 'My Widget',
        });

        const client = await app.client();
        const response = await client.get(`/api/widgets/${row.id}`).expect(200);

        const body = response.body as WidgetResponse;
        expect(body.name).toBe('My Widget');
      });
    });

    describe('given a non-existent id', () => {
      it('responds with NOT_FOUND', async () => {
        const client = await app.client();
        const response = await client
          .get(`/api/widgets/${NON_EXISTENT_UUID}`)
          .expect(404);

        const body = response.body as ErrorResponse;
        expect(body.statusCode).toBe(404);
      });
    });

    describe('given an invalid uuid', () => {
      it('responds with BAD_REQUEST', async () => {
        const client = await app.client();
        await client.get('/api/widgets/not-a-uuid').expect(400);
      });
    });
  });

  describe('POST /api/widgets', () => {
    describe('given a valid request', () => {
      it('creates and returns the widget', async () => {
        const client = await app.client();
        const response = await client
          .post('/api/widgets')
          .send({ name: 'New Widget' })
          .expect(201);

        const body = response.body as WidgetResponse;
        expect(body.name).toBe('New Widget');
        expect(body.id).toBeDefined();
      });
    });

    describe('given an invalid request body', () => {
      it('responds with UNPROCESSABLE_ENTITY', async () => {
        const client = await app.client();
        await client.post('/api/widgets').send({}).expect(422);
      });
    });
  });

  describe('DELETE /api/widgets/:id', () => {
    describe('given an existing widget', () => {
      it('deletes the widget and returns 204', async () => {
        const row = await createTestWidget(app.database, testUserId);

        const client = await app.client();
        await client.delete(`/api/widgets/${row.id}`).expect(204);

        await client.get(`/api/widgets/${row.id}`).expect(404);
      });
    });

    describe('given a non-existent id', () => {
      it('responds with NOT_FOUND', async () => {
        const client = await app.client();
        await client.delete(`/api/widgets/${NON_EXISTENT_UUID}`).expect(404);
      });
    });
  });
});
