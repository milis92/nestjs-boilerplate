---
paths:
  - "src/infra/drizzle/**"
---

# Database Layer (Drizzle ORM)

All Drizzle ORM schema definitions, relations, and typed exports are centralized in `src/infra/drizzle/`.

## Mandatory Directory structure

```
src/infra/drizzle/
├── schema.ts       # All table + enum definitions, shared column helpers
├── relations.ts    # All relation definitions
└── types.ts        # Row types ($inferSelect with optional relations, $inferInsert)
```

## Schema (`schema.ts`)

All tables and enums for every domain feature are defined in this single file. 

### Naming conventions

| Element           | Convention                 | Example                      |
|-------------------|----------------------------|------------------------------|
| Table name        | lowercase plural           | `widgets`, `widget_parts`    |
| Column name       | snake_case                 | `owner_id`, `created_at`     |
| pgEnum name       | snake_case                 | `widget_type`, `part_source` |
| Index name        | `<table>_<column>_idx`     | `widgets_owner_id_idx`       |
| Unique constraint | `<table>_<columns>_unique` | `widgets_owner_name_unique`  |

### Shared schema utilities

Defined in `schema.ts`:

- `primaryId` — UUID v7 primary key via `sql\`uuidv7()\``
- `timestamps` — `createdAt` (defaultNow, notNull) and `updatedAt` ($onUpdate)

From `@/infra/auth/auth.schema`:

- `withUserId()` — tenant FK to auth `user` table with configurable `onDelete`

```typescript
import { withUserId } from '@/infra/auth/auth.schema';

export const widgets = pgTable('widgets', {
    id: primaryId,
    ownerId: withUserId('cascade'),
    // ...
    ...timestamps,
});
```

## Relations (`relations.ts`)

A single `defineRelations()` call covers all tables. Import the full schema and define all relations together:

```typescript
import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
    widgets: {
        // One-to-many: widget belongs to one foo
        foo: r.one.foos({
            from: r.widgets.fooId,
            to: r.foos.id,
        }),
        // Many-to-many through join table
        bars: r.many.bars({
            from: r.widgets.id.through(r.widgetBars.widgetId),
            to: r.bars.id.through(r.widgetBars.barId),
        }),
    },
}));
```

### Naming conventions

Name relation properties in **singular** for one-relations and **plural** for many-relations (`account`, `tags`).

## Types (`types.ts`)

Row types extend `$inferSelect` with optional relation properties (optional because they're only present when eagerly loaded). Insert types use `$inferInsert` for new rows.

```typescript
import * as schema from './schema';

export type WidgetRow = typeof schema.widgets.$inferSelect & {
    foo?: FooRow;
    bars?: BarRow[];
};
export type NewWidgetRow = typeof schema.widgets.$inferInsert;
```

## Soft deletes

Only use `archivedAt: timestamp('archived_at', { withTimezone: true })` when the domain requires it. Most entities use hard deletes.

## Anti-patterns

- Do not edit generated migration files.
- Do not define tables or relations outside of `src/infra/drizzle/` — all schemas are centralized.
- Do not define relations in the schema file — keep them in `relations.ts`.
