import { eq } from 'drizzle-orm';
import { TestApplicationContext } from '../test-application.context';
import { widgets } from '@/infra/drizzle/schema';
import { NON_EXISTENT_UUID } from '@/testing/test-constants';
import { createTestWidget } from '@/domain/widgets/stubs/test-widget.factory';

describe('Widgets (GraphQL)', () => {
  let app: TestApplicationContext;
  let testUserId: string;

  beforeAll(async () => {
    app = await TestApplicationContext.create();
    testUserId = await app.auth.defaultUserId();
  }, 120000);

  afterAll(async () => {
    await app.teardown();
  });

  describe('Query: widgets', () => {
    afterEach(async () => {
      await app.database
        .delete(widgets)
        .where(eq(widgets.ownerId, testUserId));
    });

    describe('given no widgets exist', () => {
      it('returns an empty array', async () => {
        const result = await app.executeGraphql<{
          widgets: { id: string; name: string }[];
        }>({
          query: `query { widgets { id name } }`,
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.widgets).toEqual([]);
      });
    });

    describe('given widgets exist', () => {
      it('returns all widgets for the user', async () => {
        await createTestWidget(app.database, testUserId, { name: 'Alpha' });
        await createTestWidget(app.database, testUserId, { name: 'Beta' });

        const result = await app.executeGraphql<{
          widgets: { id: string; name: string }[];
        }>({
          query: `query { widgets { id name } }`,
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.widgets).toHaveLength(2);
      });
    });
  });

  describe('Query: widget', () => {
    let widgetId: string;

    beforeAll(async () => {
      const created = await createTestWidget(app.database, testUserId, {
        name: 'GQL Widget',
      });
      widgetId = created.id;
    });

    afterAll(async () => {
      await app.database
        .delete(widgets)
        .where(eq(widgets.ownerId, testUserId));
    });

    describe('given a valid widget id', () => {
      it('returns the widget', async () => {
        const result = await app.executeGraphql<{
          widget: { id: string; name: string };
        }>({
          query: `query($id: ID!) { widget(id: $id) { id name } }`,
          variables: { id: widgetId },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.widget.id).toBe(widgetId);
        expect(result.data?.widget.name).toBe('GQL Widget');
      });
    });

    describe('given a non-existent widget id', () => {
      it('returns a not-found error', async () => {
        const result = await app.executeGraphql({
          query: `query($id: ID!) { widget(id: $id) { id } }`,
          variables: { id: NON_EXISTENT_UUID },
        });

        expect(result.errors).toBeDefined();
        expect(result.errors![0].message).toContain('not found');
      });
    });
  });

  describe('Mutation: createWidget', () => {
    afterEach(async () => {
      await app.database
        .delete(widgets)
        .where(eq(widgets.ownerId, testUserId));
    });

    describe('given valid input', () => {
      it('creates and returns the widget', async () => {
        const result = await app.executeGraphql<{
          createWidget: { id: string; name: string };
        }>({
          query: `mutation($input: CreateWidgetInput!) {
            createWidget(input: $input) { id name }
          }`,
          variables: { input: { name: 'New Widget' } },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.createWidget.name).toBe('New Widget');
        expect(result.data?.createWidget.id).toBeDefined();
      });
    });
  });

  describe('Mutation: updateWidget', () => {
    let widgetId: string;

    beforeEach(async () => {
      const created = await createTestWidget(app.database, testUserId, {
        name: 'Original',
      });
      widgetId = created.id;
    });

    afterEach(async () => {
      await app.database
        .delete(widgets)
        .where(eq(widgets.ownerId, testUserId));
    });

    describe('given a valid widget id and input', () => {
      it('updates and returns the widget', async () => {
        const result = await app.executeGraphql<{
          updateWidget: { id: string; name: string };
        }>({
          query: `mutation($id: ID!, $input: UpdateWidgetInput!) {
            updateWidget(id: $id, input: $input) { id name }
          }`,
          variables: { id: widgetId, input: { name: 'Updated' } },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.updateWidget.name).toBe('Updated');
      });
    });

    describe('given a non-existent widget id', () => {
      it('returns a not-found error', async () => {
        const result = await app.executeGraphql({
          query: `mutation($id: ID!, $input: UpdateWidgetInput!) {
            updateWidget(id: $id, input: $input) { id }
          }`,
          variables: { id: NON_EXISTENT_UUID, input: { name: 'X' } },
        });

        expect(result.errors).toBeDefined();
        expect(result.errors![0].message).toContain('not found');
      });
    });
  });

  describe('Mutation: deleteWidget', () => {
    afterEach(async () => {
      await app.database
        .delete(widgets)
        .where(eq(widgets.ownerId, testUserId));
    });

    describe('given an existing widget', () => {
      it('deletes the widget and returns true', async () => {
        const created = await createTestWidget(app.database, testUserId, {
          name: 'To Delete',
        });

        const result = await app.executeGraphql<{ deleteWidget: boolean }>({
          query: `mutation($id: ID!) { deleteWidget(id: $id) }`,
          variables: { id: created.id },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.deleteWidget).toBe(true);

        const lookup = await app.executeGraphql({
          query: `query($id: ID!) { widget(id: $id) { id } }`,
          variables: { id: created.id },
        });
        expect(lookup.errors).toBeDefined();
      });
    });
  });
});
