---
paths:
  - "src/domain/**/*.service.ts"
---

# Service Layer

> Constraints for service classes. Domain model conventions live in `model.md`. The matching `/scaffold-service` skill provides code templates.

## Injection

- Inject `DrizzleDatabase` via `@InjectDrizzle()` from `@/infra/drizzle/drizzle.module`.
- Import tables from `@/infra/drizzle/schema`, row types from `@/infra/drizzle/types`.
- Import domain model, ID type, and Create/Update types from the `<feature>.model.ts` file.

## Method naming

- !IMPORTANT: Use these exact method names: `all`, `single`, `exists`, `create`, `update`, `delete`, `archive`, `restore`. Do NOT use `findAll`, `findOne`, `findById`, or similar.

## Ownership scoping

- !IMPORTANT: Every query MUST filter by `ownerId`. Never expose data across owners.

## Error handling

Every method wraps its body in try/catch. Re-throw `ServiceError` as-is (`instanceof` check) before wrapping with `ServiceError.database()`.

| Situation                                    | Action                                                         |
|----------------------------------------------|----------------------------------------------------------------|
| `single` not found                           | Return `null` (do not throw)                                   |
| `update`/`archive`/`restore` returning empty | `ServiceError.notFound()` -- code: `NOT_FOUND`                 |
| `delete` with `rowCount === 0`               | `ServiceError.notFound()` -- code: `NOT_FOUND`                 |
| Write succeeded but re-fetch returns nothing | `ServiceError.consistency()` -- code: `CONSISTENCY_ERROR`      |
| FK reference not owned by user               | `ServiceError.invalidReference()` -- code: `INVALID_REFERENCE` |
| Unique constraint or business rule violation | `ServiceError.conflict()` -- code: `CONFLICT`                  |
| Unexpected database failure                  | `ServiceError.database()` -- code: `DATABASE_ERROR`            |

## Anti-patterns

- NEVER return `undefined` from `single()` -- return `null`.
- NEVER throw not-found in `single()` -- return `null`.
- NEVER spread the entire update object into `.set()` -- use `omitUndefined()`.
- NEVER wrap `ServiceError` -- always check `instanceof ServiceError` first in catch blocks.
- NEVER access another module's tables directly -- always import the exported service.
- NEVER define domain model types in the service file -- they belong in `<feature>.model.ts`.
