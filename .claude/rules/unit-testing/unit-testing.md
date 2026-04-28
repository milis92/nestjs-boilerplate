---
paths:
  - "src/**/*.spec.ts"
---

## Test Setup

- !IMPORTANT: Create `TestModuleContext` with `60_000` timeout in `beforeAll` — boots an isolated NestJS module with Testcontainers PostgreSQL and Redis.
- Use `ctx.get(DepenencyToken)` to resolve providers, `ctx.database` for direct DB access, `ctx.auth` for user management.
- Delete test rows in `afterEach` via `ctx.database` scoped to `testUserId`.

## Test Naming

- !IMPORTANT: Use BDD Given-It style — every `describe('given ...')` + `it(...)` pair must read as a complete sentence.
- Prefix the context block with `given`: `given a valid input`, `given a non-existent id`, `given another owner's data`.
- Write `it` as the observable outcome, not the implementation step.
- One outer `describe` per service method, named after the method.

```
describe('<SuiteName>', () => {
  describe('<methodName>', () => {
    describe('given <condition>', () => {
      it('<expected behaviour>', async () => { ... });
    });
  });
});
```

## Test Users

- Use auth extension from `TestModuleContext` to create and manage test users.
- Clean up other users' rows before calling `ctx.auth.dropUser(otherUserId)` in owner-isolation tests.

## Non-Existent IDs

Use `nonExistentId()` from `@/testing/test-constants` which returns the nil UUID

## Anti-Patterns

- Never use `vi.mock()` or `vi.fn()` for database or service dependencies.
- Never share test data between test groups — each test creates its own data.

## Full Example

See `.claude/rules/unit-testing/examples/widgets.service.spec.ts` and `.claude/rules/unit-testing/examples/test-widget.factory.ts`.
