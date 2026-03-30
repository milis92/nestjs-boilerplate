---
name: scaffold-e2e-test
description: Create REST and GraphQL end-to-end tests with Testcontainers
---

# scaffold-e2e-test

Creates:
- `test/rest/<features>-rest.e2e-spec.ts`
- `test/graphql/<features>-gql.e2e-spec.ts`

## Inputs

- `feature` — singular lowercase (e.g., `widget`)
- `Feature` — PascalCase (e.g., `Widget`)
- `features` — plural lowercase (e.g., `widgets`)

## Template: REST E2E test

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

import { TestApplicationContext } from '../test-application.context';
import { <features> } from '@/infra/drizzle/schema';
import type { ErrorResponse } from '@/testing/error.response';
import { NON_EXISTENT_UUID } from '@/testing/test-constants';
import { createTest<Feature> } from '@/domain/<feature>/stubs/test-<feature>.factory';
import type { <Feature>Response } from '@/domain/<feature>/rest/responses/<feature>.response';

describe('<Features> REST API', () => {
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
      .delete(<features>)
      .where(eq(<features>.ownerId, testUserId));
  });

  // ── GET /<features> ────────────────────────────────────────────────

  describe('GET /<features>', () => {
    describe('given no existing <features>', () => {
      it('returns empty array', async () => {
        const client = await app.client();
        const response = await client.get('/api/<features>').expect(200);
        expect(response.body).toEqual([]);
      });
    });

    describe('given existing <features>', () => {
      it('returns all <features> for the user', async () => {
        await createTest<Feature>(app.database, testUserId, {
          name: 'Alpha',
        });
        await createTest<Feature>(app.database, testUserId, {
          name: 'Beta',
        });

        const client = await app.client();
        const response = await client.get('/api/<features>').expect(200);
        expect(response.body).toHaveLength(2);
      });

      it('returns <features> ordered by createdAt desc', async () => {
        await createTest<Feature>(app.database, testUserId, {
          name: 'First',
        });
        await createTest<Feature>(app.database, testUserId, {
          name: 'Second',
        });

        const client = await app.client();
        const response = await client.get('/api/<features>').expect(200);

        const body = response.body as <Feature>Response[];
        expect(body[0].name).toBe('Second');
        expect(body[1].name).toBe('First');
      });
    });
  });

  // ── GET /<features>/:id ────────────────────────────────────────────

  describe('GET /<features>/:id', () => {
    it('returns the <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        name: 'My <Feature>',
      });

      const client = await app.client();
      const response = await client
        .get(`/api/<features>/${row.id}`)
        .expect(200);

      const body = response.body as <Feature>Response;
      expect(body.name).toBe('My <Feature>');
    });

    it('returns 404 for non-existent ID', async () => {
      const client = await app.client();
      const response = await client
        .get(`/api/<features>/${NON_EXISTENT_UUID}`)
        .expect(404);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(404);
    });

    it('returns 400 for invalid UUID', async () => {
      const client = await app.client();
      await client.get('/api/<features>/not-a-uuid').expect(400);
    });
  });

  // ── POST /<features> ───────────────────────────────────────────────

  describe('POST /<features>', () => {
    describe('given a valid request', () => {
      it('creates and returns the <feature> with default status', async () => {
        const client = await app.client();
        const response = await client
          .post('/api/<features>')
          .send({ name: 'New <Feature>' })
          .expect(201);

        const body = response.body as <Feature>Response;
        expect(body.name).toBe('New <Feature>');
        expect(body.status).toBe('active');
        expect(body.id).toBeDefined();
      });

      it('creates a <feature> with all fields', async () => {
        const client = await app.client();
        const response = await client
          .post('/api/<features>')
          .send({
            name: 'Full <Feature>',
            description: 'A description',
            status: 'archived',
          })
          .expect(201);

        const body = response.body as <Feature>Response;
        expect(body.name).toBe('Full <Feature>');
        expect(body.description).toBe('A description');
        expect(body.status).toBe('archived');
      });
    });

    describe('given an invalid request body', () => {
      it('returns 422 for missing required fields', async () => {
        const client = await app.client();
        await client.post('/api/<features>').send({}).expect(422);
      });

      it('returns 422 for empty name', async () => {
        const client = await app.client();
        await client
          .post('/api/<features>')
          .send({ name: '' })
          .expect(422);
      });
    });
  });

  // ── PATCH /<features>/:id ──────────────────────────────────────────

  describe('PATCH /<features>/:id', () => {
    it('updates and returns the <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId);

      const client = await app.client();
      const response = await client
        .patch(`/api/<features>/${row.id}`)
        .send({ name: 'Updated' })
        .expect(200);

      const body = response.body as <Feature>Response;
      expect(body.name).toBe('Updated');
    });

    it('returns 404 for non-existent <feature>', async () => {
      const client = await app.client();
      await client
        .patch(`/api/<features>/${NON_EXISTENT_UUID}`)
        .send({ name: 'X' })
        .expect(404);
    });

    it('returns 400 for invalid UUID', async () => {
      const client = await app.client();
      await client
        .patch('/api/<features>/not-a-uuid')
        .send({ name: 'X' })
        .expect(400);
    });
  });

  // ── DELETE /<features>/:id ─────────────────────────────────────────

  describe('DELETE /<features>/:id', () => {
    it('deletes the <feature> and returns 204', async () => {
      const row = await createTest<Feature>(app.database, testUserId);

      const client = await app.client();
      await client.delete(`/api/<features>/${row.id}`).expect(204);

      // Verify deletion
      await client.get(`/api/<features>/${row.id}`).expect(404);
    });

    it('returns 404 for non-existent <feature>', async () => {
      const client = await app.client();
      await client
        .delete(`/api/<features>/${NON_EXISTENT_UUID}`)
        .expect(404);
    });

    it('returns 400 for invalid UUID', async () => {
      const client = await app.client();
      await client.delete('/api/<features>/not-a-uuid').expect(400);
    });
  });

  // ── POST /<features>/:id/archive ───────────────────────────────────

  describe('POST /<features>/:id/archive', () => {
    it('archives an active <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'active',
      });

      const client = await app.client();
      const response = await client
        .post(`/api/<features>/${row.id}/archive`)
        .expect(201);

      const body = response.body as <Feature>Response;
      expect(body.status).toBe('archived');
    });

    it('returns 409 when <feature> is already archived', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'archived',
      });

      const client = await app.client();
      const response = await client
        .post(`/api/<features>/${row.id}/archive`)
        .expect(409);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(409);
    });

    it('returns 404 for non-existent <feature>', async () => {
      const client = await app.client();
      await client
        .post(`/api/<features>/${NON_EXISTENT_UUID}/archive`)
        .expect(404);
    });
  });

  // ── POST /<features>/:id/restore ───────────────────────────────────

  describe('POST /<features>/:id/restore', () => {
    it('restores an archived <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'archived',
      });

      const client = await app.client();
      const response = await client
        .post(`/api/<features>/${row.id}/restore`)
        .expect(201);

      const body = response.body as <Feature>Response;
      expect(body.status).toBe('active');
    });

    it('returns 409 when <feature> is already active', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'active',
      });

      const client = await app.client();
      const response = await client
        .post(`/api/<features>/${row.id}/restore`)
        .expect(409);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(409);
    });

    it('returns 404 for non-existent <feature>', async () => {
      const client = await app.client();
      await client
        .post(`/api/<features>/${NON_EXISTENT_UUID}/restore`)
        .expect(404);
    });
  });
});
```

## Template: GraphQL E2E test

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

import { TestApplicationContext } from '../test-application.context';
import { <features> } from '@/infra/drizzle/schema';
import { NON_EXISTENT_UUID } from '@/testing/test-constants';
import { createTest<Feature> } from '@/domain/<feature>/stubs/test-<feature>.factory';

describe('<Features> GraphQL API', () => {
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
      .delete(<features>)
      .where(eq(<features>.ownerId, testUserId));
  });

  // ── Query: <features> ──────────────────────────────────────────────

  describe('Query: <features>', () => {
    it('returns empty array when no <features> exist', async () => {
      const result = await app.executeGraphql<{
        <features>: { id: string; name: string }[];
      }>({
        query: `query { <features> { id name } }`,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.<features>).toEqual([]);
    });

    it('returns all <features> for the user', async () => {
      await createTest<Feature>(app.database, testUserId, {
        name: 'Alpha',
      });
      await createTest<Feature>(app.database, testUserId, {
        name: 'Beta',
      });

      const result = await app.executeGraphql<{
        <features>: { id: string; name: string; status: string }[];
      }>({
        query: `query { <features> { id name status } }`,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.<features>).toHaveLength(2);
    });
  });

  // ── Query: <feature> ───────────────────────────────────────────────

  describe('Query: <feature>', () => {
    it('returns a single <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        name: 'My <Feature>',
      });

      const result = await app.executeGraphql<{
        <feature>: {
          id: string;
          name: string;
          description: string | null;
          status: string;
        };
      }>({
        query: `query <Feature>($id: ID!) { <feature>(id: $id) { id name description status } }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.<feature>.name).toBe('My <Feature>');
      expect(result.data?.<feature>.status).toBe('ACTIVE');
    });

    it('returns error for non-existent ID', async () => {
      const result = await app.executeGraphql<{
        <feature>: { id: string };
      }>({
        query: `query <Feature>($id: ID!) { <feature>(id: $id) { id } }`,
        variables: { id: NON_EXISTENT_UUID },
      });

      expect(result.errors).toBeDefined();
    });
  });

  // ── Mutation: create<Feature> ──────────────────────────────────────

  describe('Mutation: create<Feature>', () => {
    describe('given valid input', () => {
      it('creates and returns the <feature>', async () => {
        const result = await app.executeGraphql<{
          create<Feature>: { id: string; name: string; status: string };
        }>({
          query: `mutation Create<Feature>($input: Create<Feature>Input!) {
            create<Feature>(input: $input) { id name status }
          }`,
          variables: { input: { name: 'New <Feature>' } },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.create<Feature>.name).toBe('New <Feature>');
        expect(result.data?.create<Feature>.status).toBe('ACTIVE');
        expect(result.data?.create<Feature>.id).toBeDefined();
      });

      it('creates a <feature> with description', async () => {
        const result = await app.executeGraphql<{
          create<Feature>: { name: string; description: string };
        }>({
          query: `mutation Create<Feature>($input: Create<Feature>Input!) {
            create<Feature>(input: $input) { name description }
          }`,
          variables: {
            input: { name: '<Feature>', description: 'A description' },
          },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.create<Feature>.description).toBe(
          'A description',
        );
      });
    });

    describe('given invalid input', () => {
      it('returns validation error for empty name', async () => {
        const result = await app.executeGraphql<{
          create<Feature>: { id: string };
        }>({
          query: `mutation Create<Feature>($input: Create<Feature>Input!) {
            create<Feature>(input: $input) { id }
          }`,
          variables: { input: { name: '' } },
        });

        expect(result.errors).toBeDefined();
      });
    });
  });

  // ── Mutation: update<Feature> ──────────────────────────────────────

  describe('Mutation: update<Feature>', () => {
    it('updates and returns the <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        name: 'Original',
      });

      const result = await app.executeGraphql<{
        update<Feature>: { name: string; description: string | null };
      }>({
        query: `mutation Update<Feature>($id: ID!, $input: Update<Feature>Input!) {
          update<Feature>(id: $id, input: $input) { name description }
        }`,
        variables: { id: row.id, input: { name: 'Updated' } },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.update<Feature>.name).toBe('Updated');
    });

    it('returns error for non-existent <feature>', async () => {
      const result = await app.executeGraphql<{
        update<Feature>: { id: string };
      }>({
        query: `mutation Update<Feature>($id: ID!, $input: Update<Feature>Input!) {
          update<Feature>(id: $id, input: $input) { id }
        }`,
        variables: { id: NON_EXISTENT_UUID, input: { name: 'X' } },
      });

      expect(result.errors).toBeDefined();
    });
  });

  // ── Mutation: delete<Feature> ──────────────────────────────────────

  describe('Mutation: delete<Feature>', () => {
    it('deletes the <feature> and returns true', async () => {
      const row = await createTest<Feature>(app.database, testUserId);

      const result = await app.executeGraphql<{
        delete<Feature>: boolean;
      }>({
        query: `mutation Delete<Feature>($id: ID!) { delete<Feature>(id: $id) }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.delete<Feature>).toBe(true);
    });

    it('returns error for non-existent <feature>', async () => {
      const result = await app.executeGraphql<{
        delete<Feature>: boolean;
      }>({
        query: `mutation Delete<Feature>($id: ID!) { delete<Feature>(id: $id) }`,
        variables: { id: NON_EXISTENT_UUID },
      });

      expect(result.errors).toBeDefined();
    });
  });

  // ── Mutation: archive<Feature> ─────────────────────────────────────

  describe('Mutation: archive<Feature>', () => {
    it('archives an active <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'active',
      });

      const result = await app.executeGraphql<{
        archive<Feature>: { id: string; status: string };
      }>({
        query: `mutation Archive<Feature>($id: ID!) {
          archive<Feature>(id: $id) { id status }
        }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.archive<Feature>.status).toBe('ARCHIVED');
    });

    it('returns error when <feature> is already archived', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'archived',
      });

      const result = await app.executeGraphql<{
        archive<Feature>: { id: string };
      }>({
        query: `mutation Archive<Feature>($id: ID!) {
          archive<Feature>(id: $id) { id }
        }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeDefined();
    });

    it('returns error for non-existent <feature>', async () => {
      const result = await app.executeGraphql<{
        archive<Feature>: { id: string };
      }>({
        query: `mutation Archive<Feature>($id: ID!) {
          archive<Feature>(id: $id) { id }
        }`,
        variables: { id: NON_EXISTENT_UUID },
      });

      expect(result.errors).toBeDefined();
    });
  });

  // ── Mutation: restore<Feature> ─────────────────────────────────────

  describe('Mutation: restore<Feature>', () => {
    it('restores an archived <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'archived',
      });

      const result = await app.executeGraphql<{
        restore<Feature>: { id: string; status: string };
      }>({
        query: `mutation Restore<Feature>($id: ID!) {
          restore<Feature>(id: $id) { id status }
        }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.restore<Feature>.status).toBe('ACTIVE');
    });

    it('returns error when <feature> is already active', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'active',
      });

      const result = await app.executeGraphql<{
        restore<Feature>: { id: string };
      }>({
        query: `mutation Restore<Feature>($id: ID!) {
          restore<Feature>(id: $id) { id }
        }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeDefined();
    });

    it('returns error for non-existent <feature>', async () => {
      const result = await app.executeGraphql<{
        restore<Feature>: { id: string };
      }>({
        query: `mutation Restore<Feature>($id: ID!) {
          restore<Feature>(id: $id) { id }
        }`,
        variables: { id: NON_EXISTENT_UUID },
      });

      expect(result.errors).toBeDefined();
    });
  });
});
```

## Adapt the templates

- Replace all `<feature>` / `<Feature>` / `<features>` / `<Features>` with actual names.
- Adjust test data values to match the domain entity fields.
- Adjust request bodies for POST/PATCH to match the actual DTO fields.
- If no archive/restore, remove those test sections.
- GraphQL enum values appear as SCREAMING_CASE in responses (e.g., `'ACTIVE'` not `'active'`).

## Verify

Read `.claude/rules/e2e-testing.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
