---
paths:
  - "src/**/*.spec.ts"
---

# Unit Testing

Unit tests verify service logic using real PostgreSQL via Testcontainers. No mocks, no test doubles for the database.
Controller/resolver tests are not needed — they are thin delegation layers covered by service specs (logic) and E2E
specs (HTTP/GraphQL stack).

## Mandatory Directory structure

```
src/domain/<feature>/
├── <feature>.service.ts          # Domain logic, models, types (single file)
├── <feature>.service.spec.ts     # Unit tests for the service
└── ***
```

## What to test

For every method, test:

1. **Happy path** — correct result with valid input
2. **Edge cases** — minimal fields, all fields, boundary values
3. **Validation errors** — missing required fields, invalid types, invalid formats
4. **Not found** — behavior with `nonExistentId()` (null return or `ServiceError.notFound`)
5. **Partial updates** — only specified fields change, others preserved
6. **Owner isolation** — different owner's data is not accessible

## Test setup

Key setup rules:

- `beforeAll`: create context via `TestModuleBuilder.create(FeatureModule)`, get service via `ctx.get(WidgetsService)`.
  Get `testUserId` via `await ctx.auth.defaultUserId()`. Use 60s timeout for container startup.
- `afterAll`: call `ctx.teardown()` to clean up test context
- `afterEach`: clean up test data by deleting domain entity rows (e.g.,
  `ctx.database.delete(widgets).where(eq(widgets.ownerId, testUserId))`). Import table from `@/infra/drizzle/schema`.
  The test user persists across tests.

### Test utilities

- `TestModuleBuilder.create(Module)` — bootstraps isolated NestJS module with Testcontainers (no HTTP server, no infra
  modules)
- `ctx.get(Token)` — resolve any provider from the compiled module
- `ctx.database` — DrizzleDatabase for test data setup/teardown
- `ctx.auth.defaultUserId()` — returns the default test user ID (async, creates on first call)
- `ctx.auth.createUser()` — creates a new auth user, returns userId (use for multi-owner tests)
- `ctx.auth.dropUser(id)` — removes auth user (cascades deletes); clean up in afterEach
- `nonExistentId()` — from `@/testing/test-constants`, returns the nil UUID

### Test data factories

Use factory functions from domain-specific `stubs/` directories. Each factory inserts one row with sensible defaults and
accepts partial overrides. Path pattern: `@/domain/<feature>/stubs/test-<feature>.factory`.

```typescript
import {createTestAccount} from '@/domain/accounts/stubs/test-account.factory';
import {createTestMerchant} from '@/domain/merchants/stubs/test-merchant.factory';

const account = await createTestAccount(ctx.database, testUserId);
const merchant = await createTestMerchant(ctx.database, testUserId, {name: 'Custom'});
```

Factories do NOT auto-create dependencies. If a transaction needs an account, create the account first.

## Test structure

Use nested `describe` blocks with the `given/when/then` pattern:

```typescript
describe('methodName', () => {
    describe('given no existing entities', () => {
        it('returns empty array', async () => { /* ... */
        });
    });

    describe('given existing entities', () => {
        it('returns all entities ordered by name', async () => { /* ... */
        });
        it('only returns entities for the specified owner', async () => { /* ... */
        });
    });
});
```

## Anti-patterns

- Do not use `vi.mock()` or `vi.fn()` for database or service dependencies.
- Do not create manual mock implementations of services.
- Do not test private methods directly.
- Do not assert on exact timestamps — assert on type (`toBeInstanceOf(Date)`) or existence (`toBeDefined()`).
