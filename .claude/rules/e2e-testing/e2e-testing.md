---
paths:
    - "test/**/*.e2e-spec.ts"
---

## Test setup

- !IMPORTANT: Create `TestApplicationContext` with `120000` timeout in `beforeAll` block for E2E tests — it boots the
  full application with required Testcontainers

## Test Naming

- !IMPORTANT: Use BDD Given-It style — every `describe('given ...')` + `it(...)` pair must read as a complete sentence.
- Prefix the context block with `given`: `given a valid request`, `given a non-existent id`,
  `given an invalid request body`.
- Write `it` as the observable outcome, not the implementation step.

```
describe('<Feature Suite>', () => {
  describe('<operation>', () => {
    describe('given <condition>', () => {
      it('<expected behaviour>', async () => { ... });
    });
  });
});
```

## Non-Existent IDs

!IMPORTANT: Use `NON_EXISTENT_UUID` (from `@/testing/test-constants`) in E2E tests — NOT `nonExistentId()`.

`NON_EXISTENT_UUID` is a valid UUID v7 that passes `ParseUUIDPipe` validation but never matches a real row.
`nonExistentId()` is the nil UUID — only for unit tests where UUID format validation is not applied.

## Data Setup and Cleanup

- Never use mocks (`vi.mock`, `vi.fn`) — use stubs from `@/domain/<feature>/stubs/test-<feature>.factory` instead.
- Never create test data via HTTP requests — call `createTest<Feature>(app.database, ...)` directly.
- Delete rows directly via `app.database` in `afterEach` / `afterAll`:

## Test users

- Use auth extension from `TestApplicationContext` to create and manage test users.

```typescript
const defaultUserId = await app.auth.defaultUserId();            // Default test user
const otherUserId = await app.auth.createUser();                 // New test user

const otherHeaders = await app.auth.getAuthHeaders(otherUserId); // Headers for new user

await app.auth.dropUser(otherUserId);                            // Remove new user
```