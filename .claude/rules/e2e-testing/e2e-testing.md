---
paths:
  - "test/**/*.e2e-spec.ts"
---

# E2E Testing

> Full HTTP/GraphQL stack tests using Testcontainers. No mocking.

## Directory Structure

```
test/
├── rest/<features>-rest.e2e-spec.ts
├── graphql/<features>-gql.e2e-spec.ts
```

- !IMPORTANT: REST and GraphQL tests are in SEPARATE files — never mix them.
- !IMPORTANT: Real database via Testcontainers — no mocking.

## Test Setup

```typescript
let app: TestApplicationContext;
let testUserId: string;

beforeAll(async () => {
  app = await TestApplicationContext.create();
  testUserId = await app.auth.defaultUserId();
}, 120_000);

afterAll(() => app.teardown());

afterEach(async () => {
  await app.database.delete(widgets).where(eq(widgets.ownerId, testUserId));
});
```

## Test Utilities

- `TestApplicationContext.create()` from `test/test-application.context` — full NestJS app with Testcontainers (120s timeout)
- `await app.client()` — supertest agent with auth headers
- `await app.client(null)` — unauthenticated supertest agent
- `app.executeGraphql<T>({ query, variables })` — GraphQL query/mutation helper
- `app.executeGraphql(op, null)` — unauthenticated GraphQL
- `app.database` — DrizzleDatabase for setup/teardown
- `app.auth` — TestAuthContext (`defaultUserId()`, `createUser()`, `dropUser()`)
- `NON_EXISTENT_UUID` — valid UUIDv7 that matches no entity (from `@/testing/test-constants`)
- `ErrorResponse` — interface for typed error assertions (from `@/testing/error.response`)

## What to Test

1. **Happy path** — correct status code and response body
2. **Validation errors** — missing required fields, invalid types -> 422
3. **Not found** — valid UUID that doesn't exist -> 404
4. **Invalid UUID** — malformed path parameter -> 400
5. **Auth enforcement** — unauthenticated requests -> 401
6. **Side effects** — verify deletion via GET after DELETE

## REST Response Typing

Cast `response.body` to the response DTO type to avoid lint errors:

```typescript
import type { WidgetResponse } from '@/domain/widget/rest/responses/widget.response';

const body = response.body as WidgetResponse;
expect(body.name).toBe('My Widget');
```

## GraphQL Enum Values

GraphQL enum values appear as SCREAMING_CASE in responses:

```typescript
expect(result.data?.widget.status).toBe('ACTIVE');  // not 'active'
```

## Test Structure

- !IMPORTANT: Use nested `describe` blocks: outer = endpoint (e.g., `GET /widgets`), inner = scenario.

## Anti-patterns

- NEVER use `vi.mock()` or any mocking — tests hit the real database.
- NEVER share test data between describe blocks — each group creates and cleans its own data.

## Full Example

For complete working implementations, see:
- `.claude/rules/e2e-testing/examples/widgets-rest.e2e-spec.ts`
- `.claude/rules/e2e-testing/examples/widgets-gql.e2e-spec.ts`
