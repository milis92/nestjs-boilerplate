---
paths:
  - "src/domain/**/*.service.ts"
---

# Service Layer

Domain logic, models, and types for each module — all in a single `<feature>.service.ts` file.

## Domain model

Each entity has a dedicated ID type alias (`export type FooId = string`), a domain model class, and Create/Update types. The domain model is the public API — controllers, resolvers, and other services never see database rows.

### Construction from database rows

The constructor accepts the database row type and maps it to domain naming. Required fields use definite assignment (`!`), optional fields use property defaults. Always provide `static fromRowset()`. JSDoc on the class and every property.

```typescript
export class Foo {
  id!: FooId;
  owner!: UserId;           // mapped from row.ownerId
  name!: string;
  bar: Bar | null = null;   // nested relation, constructed below
  createdAt: Date = new Date();

  constructor(row: FooRow) {
    this.id = row.id;
    this.owner = row.ownerId;
    this.name = row.name;
    this.bar = row.bar ? new Bar(row.bar) : null;
    this.createdAt = row.createdAt;
  }

  static fromRowset(rows: FooRow[]): Foo[] {
    return rows.map((row) => new Foo(row));
  }
}
```

### Nested types: read vs. write

On the domain model, relations are **domain objects** (e.g., `bar: Bar | null`). The constructor hydrates them from eagerly-loaded row data (`new Bar(row.bar)`). Arrays of relations use `fromRowset()`.

On Create/Update types, relations become **ID references**. Omit the object fields from the model and add them back as IDs via intersection:

```typescript
// Simple — no relations to remap
export type CreateFoo = Omit<Foo, 'id' | 'owner' | 'createdAt' | 'updatedAt'>;

// With relations — omit objects, add IDs
export type CreateFoo = Omit<Foo, 'id' | 'owner' | 'bar' | 'tags' | 'createdAt' | 'updatedAt'> & {
  bar?: BarId;
  tags?: BazId[];
};

export type UpdateFoo = Partial<CreateFoo>;
```

Add `| 'archivedAt'` to the Omit if the model supports archiving.

## Service class

### Constructor injection

Inject `DrizzleDatabase` via `@InjectDrizzle()` (from `@/infra/drizzle/drizzle.module`). Import tables from `@/infra/drizzle/schema` and row types from `@/infra/drizzle/types`. When the service validates FK references to other modules, also inject their services.

### Standard CRUD methods

| Method    | Signature                                        | Return              |
|-----------|--------------------------------------------------|---------------------|
| `all`     | `(ownerId: UserId) => Promise<Foo[]>`            | List, ordered       |
| `single`  | `(ownerId, id) => Promise<Foo \| null>`          | Null if not found   |
| `exists`  | `(ownerId, id) => Promise<boolean>`              | Existence check     |
| `create`  | `(ownerId, data: CreateFoo) => Promise<Foo>`     | Created entity      |
| `update`  | `(ownerId, id, data: UpdateFoo) => Promise<Foo>` | Updated entity      |
| `delete`  | `(ownerId, id) => Promise<void>`                 | Void                |
| `archive` | `(ownerId, id) => Promise<Foo>`                  | Only if soft-delete |
| `restore` | `(ownerId, id) => Promise<Foo>`                  | Only if soft-delete |

### Query patterns

- **Reads**: `this.database.query.<table>.findMany/findFirst()` with `with:` for relations.
- **Existence**: `this.database.select({ id }).from(table).where(...).limit(1)` then `!!row`.
- **Writes**: `this.database.insert/update/delete(table)` with `.returning()`.
- **Partial updates**: Wrap the set object in `omitUndefined()`.
- **Ownership scoping**: Every query MUST filter by `ownerId`. Never expose data across owners.

### Cross-service validation

Validate FK references via the dependent service's `exists()` before writes. Throw `ServiceError.invalidReference()` on failure. Call at the start of `create` and `update`.

### Database transactions

Use `this.database.transaction(async (tx) => {...})` only when atomicity is needed across multiple inserts. After a transaction that inserts related data, re-fetch via `this.single()` to return the fully populated domain model.

## Error handling

Every method wraps its body in try/catch. Re-throw `ServiceError` as-is (`instanceof` check), wrap everything else with `ServiceError.database()`.

| Situation                                    | Action                                                        |
|----------------------------------------------|---------------------------------------------------------------|
| `single` not found                           | Return `null` (do not throw)                                  |
| `update`/`archive`/`restore` returning empty | `ServiceError.notFound()` — code: `NOT_FOUND`                 |
| `delete` with `rowCount === 0`               | `ServiceError.notFound()` — code: `NOT_FOUND`                 |
| Write succeeded but re-fetch returns nothing | `ServiceError.consistency()` — code: `CONSISTENCY_ERROR`      |
| FK reference not owned by user               | `ServiceError.invalidReference()` — code: `INVALID_REFERENCE` |
| Unique constraint or business rule violation | `ServiceError.conflict()` — code: `CONFLICT`                  |
| Unexpected database failure                  | `ServiceError.database()` — code: `DATABASE_ERROR`            |

## Anti-patterns

- Do not return `undefined` from `single()` — return `null`.
- Do not throw on not-found in `single()` — the controller/resolver throws `NotFoundException`.
- Do not spread the entire update object into `.set()` — use `omitUndefined()`.
- Do not use transactions unless you need atomicity across multiple inserts.
- Do not double-wrap `ServiceError` — always check `instanceof ServiceError` first in catch blocks.
- Do not access another module's tables directly — depend on the exported service.
