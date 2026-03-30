---
paths:
  - "src/infra/drizzle/**"
---

# Database Layer (Drizzle ORM)

> Constraints for database schema, relations, and types. The matching `/scaffold-database` skill provides code templates.

## Directory structure

```
src/infra/drizzle/
├── schema.ts       # All table + enum definitions, shared column helpers
├── relations.ts    # All relation definitions
└── types.ts        # Row types ($inferSelect with optional relations, $inferInsert)
```

## Naming conventions

| Element           | Convention                 | Example                      |
|-------------------|----------------------------|------------------------------|
| Table name        | lowercase plural           | `widgets`, `widget_parts`    |
| Column name       | snake_case                 | `owner_id`, `created_at`     |
| pgEnum name       | snake_case                 | `widget_type`, `part_source` |
| Index name        | `<table>_<column>_idx`     | `widgets_owner_id_idx`       |
| Unique constraint | `<table>_<columns>_unique` | `widgets_owner_name_unique`  |

## Shared schema utilities

- `primaryId`, `timestamps` -- defined in `@src/infra/drizzle/schema.ts`
- `withUserId()` -- tenant FK to auth `user` table, from `@src/infra/auth/auth.schema`
- !IMPORTANT: Every domain table MUST use `primaryId` for the id column and `...timestamps` for created/updated tracking.
- !IMPORTANT: Every domain table MUST use `withUserId('cascade')` for the `ownerId` column.

## Relations

- Name relation properties **singular** for one-relations and **plural** for many-relations (`foo`, `bars`).

## Types

- Row types: `$inferSelect` with optional relation properties (only present when eagerly loaded).
- Insert types: `$inferInsert` for new rows.
- !IMPORTANT: Export both `FooRow` and `NewFooRow` from `types.ts` for every domain table.

## Soft deletes

- Only use `archivedAt` column when the domain requires it. Prefer status enums (e.g., `active`/`archived`) for simple archiving.

## Anti-patterns

- !IMPORTANT: NEVER edit generated migration files.
- NEVER write raw SQL when Drizzle ORM queries can do the job.
- NEVER add tables to a separate schema file -- all domain tables go in `schema.ts`.
