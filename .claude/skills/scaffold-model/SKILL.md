---
name: scaffold-model
description: Create a domain model file with entity class, ID type, enum, nested model construction, and Create/Update types with FK replacements
---

# scaffold-model

Creates `src/domain/<feature>/<feature>.model.ts` (singular filename) with:
- Enum via `createEnumObject` (if needed)
- ID type alias (`string`)
- Domain model class with explicit constructor mapping
- Nested model construction for relations
- `static fromRowset()` for array mapping
- `CreateFoo` and `UpdateFoo` types with FK ID replacements
- Nested create/update types for child entities

## Template

```typescript
import { fooType } from '@/infra/drizzle/schema';
import type { FooRow, FooItemRow } from '@/infra/drizzle/types';
import type { UserId } from '@/infra/auth/auth.schema';
import { createEnumObject } from '@/domain/shared/helpers/enum-object';
import type { BarId } from '@/domain/bar/bar.model';
import { Bar } from '@/domain/bar/bar.model';

// ── Enum ─────────────────────────────────────────────────────────────

const FooType = createEnumObject(fooType.enumValues);

/** Describes what the enum represents. */
export type FooType = keyof typeof FooType;

// ── Types ────────────────────────────────────────────────────────────

/** Unique identifier of a foo. */
export type FooId = string;

/**
 * Describe the entity's purpose and its role in the domain.
 */
export class Foo {
  /** Unique identifier. */
  id!: FooId;
  /** Owner of the foo. */
  owner!: UserId;                        // renamed from row.ownerId
  /** Display name. */
  name!: string;                         // required scalar
  /** Optional notes. */
  notes: string | null = null;           // nullable scalar
  /** Foo type. */
  type!: FooType;                        // enum
  /** Associated bar. */
  bar: Bar | null = null;                // nullable single relation
  /** Child items. */
  items: FooItem[] = [];                 // relation array
  /** When this record was created. */
  createdAt: Date = new Date();
  /** When this record was last updated (null until first update). */
  updatedAt: Date | null = null;

  constructor(row: FooRow) {
    this.id = row.id;
    this.owner = row.ownerId;                              // field rename
    this.name = row.name;
    this.notes = row.notes;
    this.type = row.type;
    this.bar = row.bar ? new Bar(row.bar) : null;          // nested single
    this.items = FooItem.fromRowset(row.items || []);       // nested array
    this.createdAt = row.createdAt;
    this.updatedAt = row.updatedAt;
  }

  static fromRowset(rows: FooRow[]): Foo[] {
    return rows.map((row) => new Foo(row));
  }
}

// ── Nested Domain Model ──────────────────────────────────────────────

/** Unique identifier of a foo item. */
export type FooItemId = string;

/** Describe what this nested entity represents. */
export class FooItem {
  id!: FooItemId;
  fooId!: FooId;
  name!: string;
  bar: Bar | null = null;
  notes: string | null = null;

  constructor(row: FooItemRow) {
    this.id = row.id;
    this.fooId = row.fooId;
    this.name = row.name;
    this.bar = row.bar ? new Bar(row.bar) : null;
    this.notes = row.notes;
  }

  static fromRowset(rows: FooItemRow[]): FooItem[] {
    return rows.map((row) => new FooItem(row));
  }
}

// ── Create / Update Types ────────────────────────────────────────────

/**
 * Data required to create a new foo.
 * Omit system fields + relation objects, add back FKs as IDs.
 */
export type CreateFoo = Omit<
  Foo,
  'id' | 'owner' | 'bar' | 'items' | 'createdAt' | 'updatedAt'
> & {
  bar?: BarId;
  items?: CreateFooItem[];
};

/** Partial updates. Exclude fields managed by sub-endpoints. */
export type UpdateFoo = Partial<Omit<CreateFoo, 'items'>>;

/** Nested create — omit system fields + parent ref, replace relations with IDs. */
export type CreateFooItem = Omit<FooItem, 'id' | 'bar' | 'fooId'> & {
  bar?: BarId;
};

export type UpdateFooItem = Partial<CreateFooItem>;
```

## Adapt the template

- Replace `Foo` / `FooItem` with actual names.
- **No enum?** Remove the enum section.
- **No nested models?** Remove `FooItem` and its create/update types.
- **No relations?** Simplify `CreateFoo` to just `Omit<Foo, system-fields>`.

## Verify

Read `.claude/rules/model.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
