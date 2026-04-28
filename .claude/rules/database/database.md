---
paths:
  - "src/infra/drizzle/**"
---

## Shared Column Helpers

- Use `primaryId` for the `id` column on every domain table.
- Use `withUserId('cascade')` for the `ownerId` column on every table directly owned by a user.
- Use `...timestamps` for `createdAt`/`updatedAt` tracking on every domain table.

## Naming Conventions

| Element           | Convention                 | Example                      |
|-------------------|----------------------------|------------------------------|
| Table name        | lowercase plural           | `widgets`, `widget_parts`    |
| Column name       | snake_case                 | `owner_id`, `created_at`     |
| pgEnum name       | snake_case                 | `widget_type`, `part_source` |
| Index name        | `<table>_<column>_idx`     | `widgets_owner_id_idx`       |
| Unique constraint | `<table>_<columns>_unique` | `widgets_owner_name_unique`  |

## Row Types Pattern

!IMPORTANT: Export both `<table>Row` and `New<table>Row` from `src/infra/drizzle/types.ts` for every domain table.

- Use plain `$inferSelect` when the table has no relations.
- Extend with `& { <singular_name>?: <related_table>Row | null }` for a one-side relation.
- Extend with `& { <plural_name>?: <related_table>Row[] }` for a many-side relation.
- Mark all relation properties `?` — as they are populated only when the query uses `with:`.
- Keep `New<table>Row` as plain `$inferInsert` — never extend insert types with relations.

## Relations

- Name relation properties **singular** for one-relations and **plural** for many-relations.
- If no relations exist, leave `relations.ts` unchanged.

## Anti-patterns

- NEVER edit generated migration files.
- NEVER write raw SQL when Drizzle ORM queries can do the job.
- NEVER add tables to a separate schema file — all domain tables go in `schema.ts`.
- !IMPORTANT: NEVER DROP TABLES WITHOUT EXPLICIT USER CONFIRMATION.