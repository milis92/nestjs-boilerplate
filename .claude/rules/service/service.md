---
paths:
  - "src/domain/**/*.service.ts"
---

# Service Layer

> Business logic for a domain feature. Owns all database queries, enforces ownership scoping, and maps rows to domain models.

## Injection

Inject `DrizzleDatabase` via `@InjectDrizzle()`. Import tables from `@/infra/drizzle/schema`, row types from `@/infra/drizzle/types`, domain types from the sibling `<feature>.model.ts`.

```typescript
import { ServiceError } from '@/domain/shared/errors/service.error';
import { omitUndefined } from '@/domain/shared/helpers/omit-undefined';

import {
  InjectDrizzle,
  type DrizzleDatabase,
} from '@/infra/drizzle/drizzle.module';
import { widgets } from '@/infra/drizzle/schema';
import type { UserId } from '@/infra/auth/auth.schema';

import {
  Widget,
  type WidgetId,
  type CreateWidget,
  type UpdateWidget,
} from './widget.model';
```

## Method Naming

- !IMPORTANT: Use these exact names: `all`, `single`, `exists`, `create`, `update`, `delete`, `archive`, `restore`.
- Do NOT use `findAll`, `findOne`, `findById`, or similar.

## Ownership Scoping

- !IMPORTANT: Every query MUST filter by `ownerId`. Never expose data across owners.

## Method Behavior

| Method                | Not-found behavior                                         |
|-----------------------|------------------------------------------------------------|
| `single`              | Return `null` (do not throw)                               |
| `update`              | Throw `ServiceError.notFound()`                            |
| `delete`              | Throw `ServiceError.notFound()` (check `!result.rowCount`) |
| `archive` / `restore` | Throw `ServiceError.notFound()`                            |

## Error Handling

Every method wraps its body in try/catch. Re-throw `ServiceError` as-is before wrapping unknown errors:

```typescript
try {
  const [row] = await this.db
    .update(widgets)
    .set(omitUndefined(input))
    .where(and(eq(widgets.id, id), eq(widgets.ownerId, ownerId)))
    .returning();
  if (!row) throw ServiceError.notFound('Widget', id);
  return new Widget(row);
} catch (err) {
  if (err instanceof ServiceError) throw err;
  throw ServiceError.database('update', err);
}
```

## Update Pattern

Use `omitUndefined()` to strip unset fields before passing to `.set()`:

```typescript
.set(omitUndefined(input))
```

## Delete Pattern

Check `!result.rowCount` (not `=== 0`) to handle both zero and null:

```typescript
const result = await this.db.delete(widgets).where(...);
if (!result.rowCount) {
  throw ServiceError.notFound('Widget', id);
}
```

## Anti-patterns

- NEVER return `undefined` from `single()` — return `null`.
- NEVER throw not-found in `single()` — return `null`.
- NEVER spread the entire update object into `.set()` — use `omitUndefined()`.
- NEVER wrap `ServiceError` — always check `instanceof ServiceError` first in catch blocks.
- NEVER access another module's tables directly — import the exported service.
- NEVER define domain model types in the service file — they belong in `<feature>.model.ts`.

## Full Example

For a complete working service implementation, see:
- `.claude/rules/service/examples/widgets.service.ts`
