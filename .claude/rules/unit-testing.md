---
paths:
  - "src/**/*.spec.ts"
---

# Unit Testing

> Constraints for unit tests. The matching `/scaffold-unit-test` skill provides code templates.

- !IMPORTANT: Real PostgreSQL via Testcontainers -- no mocks, no test doubles for the database.

## What to test

1. **Happy path** -- correct result with valid input
2. **Edge cases** -- minimal fields, all fields, boundary values
3. **Validation errors** -- missing required fields, invalid types, invalid formats
4. **Not found** -- behavior with `nonExistentId()` (null return or `ServiceError.notFound`)
5. **Partial updates** -- only specified fields change, others preserved
6. **Owner isolation** -- different owner's data is not accessible

## Test setup

- `beforeAll`: create context via `TestModuleBuilder.create(FeatureModule)`, get service via `ctx.get(Service)`, get `testUserId` via `await ctx.auth.defaultUserId()`. Use 60s timeout.
- `afterAll`: call `ctx.teardown()`
- `afterEach`: clean up test data by deleting domain rows (import table from `@/infra/drizzle/schema`)

## Test utilities

- `TestModuleBuilder.create(Module)` from `@/testing/test-module.builder` -- bootstraps isolated NestJS module with Testcontainers (no HTTP server). Optional `overrides` array for replacing providers.
- `ctx.get(Token)` -- resolve any provider from the compiled module
- `ctx.database` -- DrizzleDatabase for test data setup/teardown
- `ctx.auth.defaultUserId()` -- returns default test user ID (async, creates on first call)
- `ctx.auth.createUser()` -- creates a new auth user, returns userId (for multi-owner tests)
- `ctx.auth.dropUser(id)` -- removes auth user (cascades deletes)
- `nonExistentId()` -- from `@/testing/test-constants`, returns the nil UUID

## Test data factories

- Factory functions live in `@/domain/<feature>/stubs/test-<feature>.factory`
- Returns the raw database row (not a domain model), uses `NewFooRow` for overrides
- Factories do NOT auto-create dependencies -- create prerequisites first
- !IMPORTANT: Factory function name follows `createTest<Feature>` pattern (e.g., `createTestWidget`)

## Test structure

- !IMPORTANT: Use nested `describe` blocks with the `given/when/then` pattern.
- One `describe` block per service method (named after the method: `describe('all', ...)`)
- Test names start with `given ...` or describe the scenario directly

## Anti-patterns

- NEVER use `vi.mock()` or `vi.fn()` for database or service dependencies.
- NEVER share test data between test groups -- each test creates its own data.
