---
paths:
  - "src/infra/drizzle/**"
---

# Database Layer (Drizzle ORM)

> Schema definitions, relations, and row types for PostgreSQL via Drizzle ORM.

## Directory Structure

All domain tables share three files in `src/infra/drizzle/`:

- `schema.ts` — all table + enum definitions, shared column helpers
- `relations.ts` — all relation definitions
- `types.ts` — row types (`$inferSelect` with optional relations, `$inferInsert`)

## Shared Column Helpers

Every domain table MUST use these three from `schema.ts` and `auth.schema.ts`:

```typescript
import { primaryId, timestamps } from '@/infra/drizzle/schema';
import { withUserId } from '@/infra/auth/auth.schema';

export const widgets = pgTable('widgets', {
  id: primaryId,
  ownerId: withUserId('cascade'),
  // ... domain columns ...
  ...timestamps,
});
```

- !IMPORTANT: Every domain table MUST use `primaryId` for the id column.
- !IMPORTANT: Every domain table MUST use `...timestamps` for created/updated tracking.
- !IMPORTANT: Every domain table MUST use `withUserId('cascade')` for the `ownerId` column.

## Naming Conventions

| Element           | Convention                 | Example                      |
|-------------------|----------------------------|------------------------------|
| Table name        | lowercase plural           | `widgets`, `widget_parts`    |
| Column name       | snake_case                 | `owner_id`, `created_at`     |
| pgEnum name       | snake_case                 | `widget_type`, `part_source` |
| Index name        | `<table>_<column>_idx`     | `widgets_owner_id_idx`       |
| Unique constraint | `<table>_<columns>_unique` | `widgets_owner_name_unique`  |

## Table Definition Pattern

```typescript
export const widgetStatus = pgEnum('widget_status', ['active', 'archived']);

export const widgets = pgTable(
  'widgets',
  {
    id: primaryId,
    ownerId: withUserId('cascade'),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: widgetStatus('status').notNull().default('active'),
    priority: integer('priority').notNull().default(0),
    ...timestamps,
  },
  (t) => [index('widgets_owner_id_idx').on(t.ownerId)],
);
```

## Row Types Pattern

Export both select and insert types from `types.ts`:

```typescript
export type WidgetRow = typeof widgets.$inferSelect;
export type NewWidgetRow = typeof widgets.$inferInsert;
```

- !IMPORTANT: Export both `FooRow` and `NewFooRow` from `types.ts` for every domain table.

## Relations

- Name relation properties **singular** for one-relations and **plural** for many-relations.
- If no relations exist, leave `relations.ts` unchanged.

## Anti-patterns

- !IMPORTANT: NEVER edit generated migration files.
- NEVER write raw SQL when Drizzle ORM queries can do the job.
- NEVER add tables to a separate schema file — all domain tables go in `schema.ts`.

## Post-creation

After modifying schema files:
```bash
pnpm db:generate   # Generate migration (requires running DB)
pnpm db:migrate    # Apply migration
```

## Full Example

For a complete working implementation, see:
- `.claude/rules/database/examples/schema.ts`
- `.claude/rules/database/examples/relations.ts`
- `.claude/rules/database/examples/types.ts`
