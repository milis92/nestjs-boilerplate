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
import { NON_EXISTENT_UUID } from '@/testing/test-constants';
import { createTestWidget } from '@/domain/widget/stubs/test-widget.factory';

describe('Widgets GraphQL API', () => {
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

  // ── Query: widgets ──────────────────────────────────────────────

  describe('Query: widgets', () => {
    it('returns empty array when no widgets exist', async () => {
      const result = await app.executeGraphql<{
        widgets: { id: string; name: string }[];
      }>({
        query: `query { widgets { id name } }`,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.widgets).toEqual([]);
    });

    it('returns all widgets for the user', async () => {
      await createTestWidget(app.database, testUserId, {
        name: 'Alpha',
      });
      await createTestWidget(app.database, testUserId, {
        name: 'Beta',
      });

      const result = await app.executeGraphql<{
        widgets: { id: string; name: string; status: string }[];
      }>({
        query: `query { widgets { id name status } }`,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.widgets).toHaveLength(2);
    });
  });

  // ── Query: widget ───────────────────────────────────────────────

  describe('Query: widget', () => {
    it('returns a single widget', async () => {
      const row = await createTestWidget(app.database, testUserId, {
        name: 'My Widget',
      });

      const result = await app.executeGraphql<{
        widget: {
          id: string;
          name: string;
          description: string | null;
          status: string;
        };
      }>({
        query: `query Widget($id: ID!) { widget(id: $id) { id name description status } }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.widget.name).toBe('My Widget');
      expect(result.data?.widget.status).toBe('ACTIVE');
    });

    it('returns error for non-existent ID', async () => {
      const result = await app.executeGraphql<{
        widget: { id: string };
      }>({
        query: `query Widget($id: ID!) { widget(id: $id) { id } }`,
        variables: { id: NON_EXISTENT_UUID },
      });

      expect(result.errors).toBeDefined();
    });
  });

  // ── Mutation: createWidget ──────────────────────────────────────

  describe('Mutation: createWidget', () => {
    describe('given valid input', () => {
      it('creates and returns the widget', async () => {
        const result = await app.executeGraphql<{
          createWidget: { id: string; name: string; status: string };
        }>({
          query: `mutation CreateWidget($input: CreateWidgetInput!) {
            createWidget(input: $input) { id name status }
          }`,
          variables: { input: { name: 'New Widget' } },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.createWidget.name).toBe('New Widget');
        expect(result.data?.createWidget.status).toBe('ACTIVE');
        expect(result.data?.createWidget.id).toBeDefined();
      });
    });
  });

  // ── Mutation: updateWidget ──────────────────────────────────────

  describe('Mutation: updateWidget', () => {
    it('updates and returns the widget', async () => {
      const row = await createTestWidget(app.database, testUserId, {
        name: 'Original',
      });

      const result = await app.executeGraphql<{
        updateWidget: { name: string; description: string | null };
      }>({
        query: `mutation UpdateWidget($id: ID!, $input: UpdateWidgetInput!) {
          updateWidget(id: $id, input: $input) { name description }
        }`,
        variables: { id: row.id, input: { name: 'Updated' } },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.updateWidget.name).toBe('Updated');
    });

    it('returns error for non-existent widget', async () => {
      const result = await app.executeGraphql<{
        updateWidget: { id: string };
      }>({
        query: `mutation UpdateWidget($id: ID!, $input: UpdateWidgetInput!) {
          updateWidget(id: $id, input: $input) { id }
        }`,
        variables: { id: NON_EXISTENT_UUID, input: { name: 'X' } },
      });

      expect(result.errors).toBeDefined();
    });
  });

  // ── Mutation: deleteWidget ──────────────────────────────────────

  describe('Mutation: deleteWidget', () => {
    it('deletes the widget and returns true', async () => {
      const row = await createTestWidget(app.database, testUserId);

      const result = await app.executeGraphql<{
        deleteWidget: boolean;
      }>({
        query: `mutation DeleteWidget($id: ID!) { deleteWidget(id: $id) }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.deleteWidget).toBe(true);
    });

    it('returns error for non-existent widget', async () => {
      const result = await app.executeGraphql<{
        deleteWidget: boolean;
      }>({
        query: `mutation DeleteWidget($id: ID!) { deleteWidget(id: $id) }`,
        variables: { id: NON_EXISTENT_UUID },
      });

      expect(result.errors).toBeDefined();
    });
  });
});
