---
paths:
  - "src/domain/**/*.model.ts"
---

# Domain Model

> Each feature has a `<feature>.model.ts` file (singular name) containing the domain class, ID type alias, enum, and Create/Update types.

## ID Type Alias

Export as a simple string:

```typescript
export type WidgetId = string;
```

## Enum via `createEnumObject`

Import the pgEnum values from `@/infra/drizzle/schema`, create the enum object and export the key type:

```typescript
import { widgetStatus } from '@/infra/drizzle/schema';
import { createEnumObject } from '@/domain/shared/helpers/enum-object';

export const WidgetStatus = createEnumObject(widgetStatus.enumValues);
/** Describes what the enum represents. */
export type WidgetStatus = keyof typeof WidgetStatus;
```

## Field Patterns

| Pattern           | Declaration                                   | Default                    |
|-------------------|-----------------------------------------------|----------------------------|
| Required scalar   | `name!: string`                               | none (definite assignment) |
| Nullable scalar   | `notes: string \| null`                       | `= null`                   |
| Nullable relation | `bar: Bar \| null`                            | `= null`                   |
| Relation array    | `items: FooItem[]`                            | `= []`                     |
| Enum              | `type!: FooType`                              | none (definite assignment) |
| Timestamps        | `createdAt: Date` / `updatedAt: Date \| null` | `= new Date()` / `= null`  |

- !IMPORTANT: `updatedAt` is `Date | null` — null on initial insert.

## Constructor Mapping

- !IMPORTANT: Map each field explicitly. NEVER use `Object.assign(this, row)`.

```typescript
constructor(row: WidgetRow) {
  this.id = row.id;
  this.owner = row.ownerId;                         // field rename
  this.name = row.name;
  this.description = row.description;
  this.bar = row.bar ? new Bar(row.bar) : null;     // nested single
  this.items = FooItem.fromRowset(row.items || []);  // nested array
  this.createdAt = row.createdAt;
  this.updatedAt = row.updatedAt;
}
```

## Static Factory

Always provide `static fromRowset(rows: FooRow[]): Foo[]` — delegates to `new Foo(row)` via `.map()`.

## Create / Update Types

- `CreateFoo` = `Omit<Foo, system + relation fields>` with FK IDs added back.
- `UpdateFoo` = `Partial<Omit<CreateFoo, fields-managed-by-sub-endpoints>>`.

```typescript
export type CreateWidget = Omit<
  Widget,
  'id' | 'owner' | 'createdAt' | 'updatedAt'
>;
export type UpdateWidget = Partial<CreateWidget>;
```

## Documentation

- JSDoc (`/** */`) on the class, every property, every exported type, and the enum type alias.

## Anti-patterns

- NEVER use `Object.assign(this, row)` or spread to populate domain fields.
- NEVER import row types at the controller/resolver layer — only the model types.
- NEVER define the domain model inside the service file — it lives in its own `<feature>.model.ts`.
- NEVER use raw relation objects in Create/Update types — replace with their ID type.

## Full Example

For a complete working implementation, see:
- `.claude/rules/model/examples/widget.model.ts`
