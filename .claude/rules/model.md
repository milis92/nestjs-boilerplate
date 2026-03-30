---
paths:
  - "src/domain/**/*.model.ts"
---

# Domain Model

> Each feature has a `<feature>.model.ts` file (singular name) containing the domain class, ID type alias, enum, and Create/Update types. The matching `/scaffold-model` skill provides code templates.

## ID type alias

- Export as a simple string: `export type FooId = string`.

## Enum via `createEnumObject`

- Import the pgEnum values from `@/infra/drizzle/schema`.
- Create the enum object: `export const FooStatus = createEnumObject(fooStatus.enumValues)`.
- Export the key type: `export type FooStatus = keyof typeof FooStatus`.
- JSDoc on the type alias explaining what the enum represents.

## Field patterns

| Pattern | Declaration | Default |
|---|---|---|
| Required scalar | `name!: string` | none (definite assignment) |
| Nullable scalar | `notes: string \| null` | `= null` |
| Nullable relation | `bar: Bar \| null` | `= null` |
| Relation array | `items: FooItem[]` | `= []` |
| Enum | `type!: FooType` | none (definite assignment) |
| Timestamps | `createdAt: Date` / `updatedAt: Date \| null` | `= new Date()` / `= null` |

- !IMPORTANT: `updatedAt` is `Date | null` — null on initial insert.

## Constructor mapping

- !IMPORTANT: Map each field explicitly. NEVER use `Object.assign(this, row)`.
- **Scalar / enum**: `this.name = row.name`
- **Field rename**: `this.owner = row.ownerId`
- **Nested single**: `this.bar = row.bar ? new Bar(row.bar) : null`
- **Nested array**: `this.items = FooItem.fromRowset(row.items || [])`

## Static factory

- Always provide `static fromRowset(rows: FooRow[]): Foo[]` — delegates to `new Foo(row)` via `.map()`.

## Create / Update types

- `CreateFoo` = `Omit<Foo, system + relation fields> & { relation?: RelationId; nested?: CreateNested[] }`.
- `UpdateFoo` = `Partial<Omit<CreateFoo, fields-managed-by-sub-endpoints>>`.
- Nested create types: same Omit + intersect pattern for child entities.
- JSDoc on every type.

## Documentation

- JSDoc (`/** */`) on the class, every property, every exported type, and the enum type alias.

## Anti-patterns

- NEVER use `Object.assign(this, row)` or spread to populate domain fields.
- NEVER import row types at the controller/resolver layer — only the model types.
- NEVER define the domain model inside the service file — it lives in its own `<feature>.model.ts`.
- NEVER use raw relation objects in Create/Update types — replace with their ID type.
