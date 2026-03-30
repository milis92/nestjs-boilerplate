---
name: scaffold-database
description: Add database schema (pgEnum, pgTable), relations, and row types for a new domain feature
---

# scaffold-database

Adds to existing infrastructure files:
- `src/infra/drizzle/schema.ts` — pgEnum + pgTable
- `src/infra/drizzle/relations.ts` — relation definitions
- `src/infra/drizzle/types.ts` — Row + NewRow types

## Inputs

- `feature` — singular lowercase (e.g., `widget`)
- `features` — plural lowercase (e.g., `widgets`)
- `Feature` — PascalCase (e.g., `Widget`)
- `columns` — list of domain columns (name, type, constraints)
- `enumName` — optional enum name (e.g., `widget_status`)
- `enumValues` — optional enum values (e.g., `['active', 'archived']`)

## Template: Additions to `schema.ts`

```typescript
// ── <Feature> Enums ────────────────────────────────────────────────────
export const <feature>Status = pgEnum('<feature>_status', [
  'active',
  'archived',
]);

// ── <Feature> Tables ───────────────────────────────────────────────────
export const <features> = pgTable(
  '<features>',
  {
    id: primaryId,
    ownerId: withUserId('cascade'),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: <feature>Status('status').notNull().default('active'),
    ...timestamps,
  },
  (t) => [index('<features>_owner_id_idx').on(t.ownerId)],
);
```

## Template: Additions to `types.ts`

```typescript
export type <Feature>Row = typeof schema.<features>.$inferSelect;
export type New<Feature>Row = typeof schema.<features>.$inferInsert;
```

## Template: Additions to `relations.ts`

If the feature has relations to other tables, add them inside the `defineRelations` callback:

```typescript
export const relations = defineRelations(schema, (r) => ({
  <features>: {
    // Add one() or many() relations here
  },
}));
```

For features with no relations, leave `relations.ts` unchanged.

## Adapt the templates

- Replace all `<feature>` / `<Feature>` / `<features>` with actual names.
- Adjust columns to match domain requirements — add/remove as needed.
- Ensure `schema.ts` has the required imports: `pgTable`, `pgEnum`, `varchar`, `text`, `index` from `drizzle-orm/pg-core`, `sql` from `drizzle-orm`, and `withUserId` from `@/infra/auth/auth.schema`. Add any additional column types as needed (e.g., `integer`, `boolean`).
- If no enum is needed, omit the pgEnum definition.
- Always include `primaryId`, `withUserId('cascade')`, and `...timestamps`.

## Post-creation

After modifying schema files, run:
```bash
pnpm db:generate   # Generate migration (requires running DB)
pnpm db:migrate    # Apply migration
```

## Verify

Read `.claude/rules/database.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
