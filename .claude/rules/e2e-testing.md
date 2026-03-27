---
paths:
  - "test/**/*.e2e-spec.ts"
---

# E2E Testing

E2E tests verify endpoints end-to-end against a real NestJS app with Testcontainers PostgreSQL.

## Mandatory Directory structure

```
test/
├── rest/<feature>-rest.e2e-spec.ts       # REST e2e tests
├── graphql/<feature>-gql.e2e-spec.ts     # GraphQL e2e tests
```

## Test setup

Use direct database inserts for preconditions:

- `beforeAll`/`afterAll` for read-only test groups (GET endpoints).
- `beforeEach`/`afterEach` for mutating test groups (POST, PATCH, DELETE).

### Test app bootstrap

```typescript
let app: TestApplicationContext;
let testUserId: string;

beforeAll(async () => {
    app = await TestApplicationContext.create();
    testUserId = await app.auth.defaultUserId();
}, 120000);

afterAll(async () => {
    await app.teardown();
});
```

## Test naming

Organize by HTTP method (REST) or operation (GraphQL) and use nested `describe` blocks with the `given/when/then`
pattern:

```typescript
// REST
describe('POST /widgets', () => {
    describe('given a valid request', () => { /* ... */
    });
    describe('given an invalid request body', () => { /* ... */
    });
});

// GraphQL
describe('Mutation: createWidget', () => {
    describe('given valid input', () => { /* ... */
    });
    describe('given invalid input', () => { /* ... */
    });
});
```

## Writing assertions (REST)

Use `await app.client()` (async, returns supertest agent with auth headers):

```typescript
const client = await app.client();
const response = await client.get('/widgets').expect(200);

const body = response.body as WidgetResponse;
expect(body.name).toBe('Test');
```

For error responses:

```typescript
const body = response.body as ErrorResponse;
expect(body.statusCode).toBe(404);
expect(body.message).toContain('not found');
```

## Writing assertions (GraphQL)

Use `app.executeGraphql<T>()` for typed GraphQL queries:

```typescript
const result = await app.executeGraphql<{
    widgets: { id: string; name: string }[];
}>({
    query: `query { widgets { id name } }`,
});

expect(result.errors).toBeUndefined();
expect(result.data?.widgets).toHaveLength(2);
```

For mutations with variables:

```typescript
const result = await app.executeGraphql<{ createWidget: { id: string } }>({
    query: `mutation CreateWidget($input: CreateWidgetInput!) {
        createWidget(input: $input) { id }
    }`,
    variables: {input: {name: 'New Widget'}},
});

expect(result.errors).toBeUndefined();
expect(result.data?.createWidget.id).toBeDefined();
```

## What to test

For each endpoint, test:

1. **Happy path** — correct status code and response body
2. **Validation errors** — missing required fields, invalid types, invalid formats -> 422
3. **Not found** — valid UUID that doesn't exist -> 404
4. **Invalid UUID** — malformed path parameter -> 400
5. **Side effects** — verify deletion via GET after DELETE, verify archive sets `archivedAt`

## Test utilities

- `TestApplicationContext.create()` — bootstraps full NestJS app with Testcontainers (120s timeout)
- `await app.client()` — supertest agent with auth headers (async), pass null or custom headers to override
- `app.executeGraphql<T>({ query, variables })` — GraphQL query/mutation helper
- `app.database` — DrizzleDatabase for setup/teardown
- `app.auth` — TestAuthContext for test user management (`defaultUserId()`, `createUser()`, `dropUser()`)
- `ErrorResponse` — interface for typed error response assertions (from `@/testing/error.response`)
- `NON_EXISTENT_UUID` — valid UUIDv7 that matches no entity (from `@/testing/test-constants`);

## Anti-patterns

- Do not use `vi.mock()` or any mocking. Tests hit the real database.
