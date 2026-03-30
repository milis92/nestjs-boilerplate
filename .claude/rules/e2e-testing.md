---
paths:
  - "test/**/*.e2e-spec.ts"
---

# E2E Testing

> Constraints for end-to-end tests. The matching `/scaffold-e2e-test` skill provides code templates.

## Directory structure

```
test/
├── rest/<feature>-rest.e2e-spec.ts       # REST e2e tests
├── graphql/<feature>-gql.e2e-spec.ts     # GraphQL e2e tests
```

- !IMPORTANT: Real database via Testcontainers -- no mocking.

## Test setup timing

- `beforeAll`/`afterAll` for read-only test groups (GET endpoints)
- `beforeEach`/`afterEach` for mutating test groups (POST, PATCH, DELETE)

## What to test

1. **Happy path** -- correct status code and response body
2. **Validation errors** -- missing required fields, invalid types -> 422
3. **Not found** -- valid UUID that doesn't exist -> 404
4. **Invalid UUID** -- malformed path parameter -> 400
5. **Side effects** -- verify deletion via GET after DELETE, verify archive sets `archivedAt`

## Test utilities

- `TestApplicationContext.create()` from `test/test-application.context` -- bootstraps full NestJS app with Testcontainers (120s timeout)
- `await app.client()` -- supertest agent with auth headers (async)
- `app.executeGraphql<T>({ query, variables })` -- GraphQL query/mutation helper
- `app.database` -- DrizzleDatabase for setup/teardown
- `app.auth` -- TestAuthContext for test user management (`defaultUserId()`, `createUser()`, `dropUser()`)
- `ErrorResponse` -- interface for typed error assertions (from `@/testing/error.response`)
- `NON_EXISTENT_UUID` -- valid UUIDv7 that matches no entity (from `@/testing/test-constants`)

## Test structure

- !IMPORTANT: Use nested `describe` blocks: outer = endpoint (e.g., `GET /widgets`), inner = scenario (e.g., `given no existing widgets`).
- !IMPORTANT: REST and GraphQL tests are in SEPARATE files -- never mix them.

## Anti-patterns

- NEVER use `vi.mock()` or any mocking -- tests hit the real database.
- NEVER share test data between describe blocks -- each group creates and cleans its own data.
