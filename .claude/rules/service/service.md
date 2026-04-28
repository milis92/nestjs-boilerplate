---
paths:
    - "src/domain/**/*.service.ts"
---

## Method Naming

| Operation       | Signature                                                 | Returns                  |
|-----------------|-----------------------------------------------------------|--------------------------|
| List all        | `all(ownerId: UserId)`                                    | `Promise<Model[]>`       |
| Fetch one       | `single(ownerId: UserId, id: ModelId)`                    | `Promise<Model \| null>` |
| Existence check | `exists(ownerId: UserId, id: ModelId)`                    | `Promise<boolean>`       |
| Create          | `create(ownerId: UserId, data: CreateModel)`              | `Promise<Model>`         |
| Update          | `update(ownerId: UserId, id: ModelId, data: UpdateModel)` | `Promise<Model>`         |
| Delete          | `delete(ownerId: UserId, id: ModelId)`                    | `Promise<void>`          |
| Soft-delete     | `archive(ownerId: UserId, id: ModelId)`                   | `Promise<Model>`         |
| Restore         | `restore(ownerId: UserId, id: ModelId)`                   | `Promise<Model>`         |

## Owner Isolation

!IMPORTANT: Include `ownerId` in every WHERE clause. Never query by entity ID alone.

## ServiceError Factory Selection

Use the factory that matches the failure cause:

| Factory                                         | When to use                                                |
|-------------------------------------------------|------------------------------------------------------------|
| `ServiceError.notFound(entity, id)`             | `.returning()` gave no row; delete `rowCount === 0`        |
| `ServiceError.consistency(operation, entityId)` | Write succeeded but subsequent re-fetch returned null      |
| `ServiceError.invalidReference(entity, id)`     | A referenced entity doesn't belong to the owner            |
| `ServiceError.conflict(message)`                | Business rule violated (e.g., concurrent-job cap exceeded) |
| `ServiceError.database(operation, cause)`       | Any unexpected DB exception                                |

## Re-throw Guard

!IMPORTANT: Every catch block that can produce a `ServiceError` inside its try body must re-throw it before converting
to `ServiceError.database`. Without this, a `NOT_FOUND` or `INVALID_REFERENCE` thrown mid-method becomes a
`DATABASE_ERROR`.

```typescript
} catch(error){
    if (error instanceof ServiceError) throw error;
    throw ServiceError.database('updating widget', error);
}
```

Omit the guard only when the try body cannot produce a `ServiceError` (e.g., a plain `findMany` with no intermediate
throws).

## Detecting Not-Found

For `insert`/`update` with `.returning()` — destructure the first element, check for absence:

```typescript
const [row] = await this.database.update(...).returning();
if (!row) throw ServiceError.notFound('Widget', widgetId);
```

For `delete` — check `rowCount`:

```typescript
if (result.rowCount === 0) throw ServiceError.notFound('Widget', widgetId);
```

## Update Payloads

Always wrap `.set({...})` in `omitUndefined()` so unset optional fields don't overwrite existing values:

```typescript
.
set(omitUndefined({ name: data.name, notes: data.notes }))
```

## Model Construction

Return `new Model(row)` for single results and `Model.fromRowset(rows)` for collections. Never return raw Drizzle rows.

## Cross-Service Ownership Validation

When a referenced entity must belong to the owner, call the owning service's `single()` or `exists()` — never write a
direct DB query for it. Throw `ServiceError.invalidReference(entity, id)` when the check fails.

## DB Field Name

Name the injected database field `database`, not `db`.

## Full Example

@.claude/rules/service/examples/widgets.service.ts
