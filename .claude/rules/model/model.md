---
paths:
    - "src/domain/**/*.model.ts"
---

## File Structure

Declare in this order: enums → ID types → model class → Create/Update types.

## ID Types

Export a dedicated string alias for every entity:

```typescript
/** Unique identifier of a widget. */
export type WidgetId = string;
```

- One exported type per entity with a JSDoc comment.

## Model Class

- Constructor takes the corresponding `<Table>Row` type from `@/infra/drizzle/types`.
- Map every field explicitly in the constructor body — no spreads, no `Object.assign`.
- Include `static fromRowset(rows: <Table>Row[]): <Model>[]` on every class.

## Field Declarations

| Field kind           | Declaration form                                                  | Example                        |
|----------------------|-------------------------------------------------------------------|--------------------------------|
| Required             | `field!: Type`                                                    | `name!: string`                |
| Nullable / optional  | `field: Type \| null = null`                                      | `notes: string \| null = null` |
| Boolean with default | `field: boolean = <default>`                                      | `isHidden: boolean = false`    |
| Numeric with default | `field: number = <default>`                                       | `sortOrder: number = 0`        |
| Array relation       | `field: Foo[] = []`                                               | `splits: Split[] = []`         |
| Timestamps           | `createdAt: Date = new Date()` / `updatedAt: Date \| null = null` | —                              |

!IMPORTANT: Nullable fields are always `Type | null = null` — never `field?: Type` or `Type | undefined`. The
distinction between `null` (absent) and `undefined` (not set) is intentional.

## Model References (Field Naming)

!IMPORTANT: Fields that reference another entity are named after the **model** — never with an `Id` suffix — even when
the stored value is just the ID:

```typescript
// ✅ correct
group!
:
WidgetGroupId;
category: WidgetCategory | null = null;

// ❌ wrong
groupId!
:
WidgetGroupId;
categoryId: WidgetCategoryId | null = null;
```

When the related entity is eagerly loaded (joined), the field holds the full model object. When it is not loaded, it
holds the ID. Either way, the field name is the model name.

## Create Types

Derive from the model using `Omit`, then override nested-model fields with their ID types:

```typescript
export type CreateWidget = Omit<
        Widget,
        'id' | 'owner' | 'group' | 'category' | 'createdAt' | 'updatedAt'
> & {
    group: WidgetGroupId;
    category?: WidgetCategoryId;
};
```

- Omit system-generated fields: `id`, `owner`, timestamps (`createdAt`, `updatedAt`, `archivedAt`).
- Omit every field whose type differs in the create shape (nested models, amount types, etc.).
- Re-add those fields in the intersection: nested model references become their ID type (e.g., `WidgetCategory | null` →
  `WidgetCategoryId`); complex value types become their primitive form (e.g., `Amount` → `MinorUnit`).

## Update Types

Always `Partial<CreateModel>`:

```typescript
export type UpdateWidget = Partial<CreateWidget>;
```

If a subfield needs to be excluded from updates (e.g., `splits` on a transaction), use
`Partial<Omit<CreateModel, 'splits'>>`.

## Anti-patterns

- NEVER use `modelId` as a field name — use the model name (`group`, not `groupId`).
- NEVER spread or `Object.assign` a row into the model — map every field explicitly.
- NEVER define Create/Update types in the service file — they belong here.
- NEVER write `UpdateModel = Partial<Model>` — always base Update on the Create type.

For a complete example, see:

- `.claude/rules/model/examples/widget.model.ts`
