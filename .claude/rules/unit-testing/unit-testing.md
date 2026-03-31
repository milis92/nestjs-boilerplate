---
paths:
  - "src/**/*.spec.ts"
---

# Unit Testing

> Service-level tests using real PostgreSQL via Testcontainers. No mocks.

- !IMPORTANT: Real PostgreSQL via Testcontainers — no mocks, no test doubles for the database.

## Test Setup

```typescript
let ctx: TestModuleContext;
let service: WidgetsService;
let testUserId: UserId;

beforeAll(async () => {
  ctx = await TestModuleBuilder.create(WidgetsModule);
  service = ctx.get(WidgetsService);
  testUserId = await ctx.auth.defaultUserId();
}, 60_000);

afterAll(() => ctx.teardown());

afterEach(async () => {
  await ctx.database.delete(widgets).where(eq(widgets.ownerId, testUserId));
});
```

## Test Utilities

- `TestModuleBuilder.create(Module)` from `@/testing/test-module.builder` — bootstraps isolated NestJS module with Testcontainers
- `ctx.get(Token)` — resolve any provider
- `ctx.database` — DrizzleDatabase for test data setup/teardown
- `ctx.auth.defaultUserId()` — returns default test user ID
- `ctx.auth.createUser()` — creates a new auth user (for multi-owner tests)
- `ctx.auth.dropUser(id)` — removes auth user
- `nonExistentId()` — from `@/testing/test-constants`, returns the nil UUID

## What to Test

1. **Happy path** — correct result with valid input
2. **Edge cases** — minimal fields, all fields, boundary values
3. **Not found** — behavior with `nonExistentId()` (null return or `ServiceError.notFound`)
4. **Partial updates** — only specified fields change, others preserved
5. **Owner isolation** — different owner's data is not accessible

## Test Data Factories

- Factory functions live in `@/domain/<feature>/stubs/test-<feature>.factory`
- Returns the raw database row (not a domain model), uses `NewFooRow` for overrides
- !IMPORTANT: Factory function name follows `createTest<Feature>` pattern

```typescript
export async function createTestWidget(
  db: DrizzleDatabase,
  ownerId: UserId,
  overrides: Partial<NewWidgetRow> = {},
) {
  const [row] = await db
    .insert(widgets)
    .values({ ownerId, name: 'Test Widget', status: 'active', ...overrides })
    .returning();
  return row;
}
```

## Test Structure

- !IMPORTANT: Use nested `describe` blocks with the `given/when/then` pattern.
- One `describe` block per service method (named after the method: `describe('all', ...)`)

## Owner Isolation Pattern

```typescript
it('does not return widgets owned by another user', async () => {
  const otherUserId = await ctx.auth.createUser();
  await createTestWidget(ctx.database, otherUserId, { name: 'Other' });
  await createTestWidget(ctx.database, testUserId, { name: 'Mine' });

  const result = await service.all(testUserId);
  expect(result).toHaveLength(1);
  expect(result[0].name).toBe('Mine');

  // Clean up other user's data
  await ctx.database.delete(widgets).where(eq(widgets.ownerId, otherUserId));
  await ctx.auth.dropUser(otherUserId);
});
```

## Anti-patterns

- NEVER use `vi.mock()` or `vi.fn()` for database or service dependencies.
- NEVER share test data between test groups — each test creates its own data.

## Full Example

For complete working implementations, see:
- `.claude/rules/unit-testing/examples/widgets.service.spec.ts`
- `.claude/rules/unit-testing/examples/test-widget.factory.ts`
