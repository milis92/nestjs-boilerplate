---
name: scaffold-service
description: Create a service class with CRUD methods, error handling, and ownership scoping
---

# scaffold-service

Creates `src/domain/<feature>/<features>.service.ts` with:
- Constructor injection of DrizzleDatabase
- All CRUD methods: `all`, `single`, `create`, `update`, `delete`, `archive`, `restore`
- Error handling with `ServiceError`
- Ownership scoping via `ownerId`

## Inputs

- `feature` — singular lowercase (e.g., `widget`)
- `Feature` — PascalCase (e.g., `Widget`)
- `features` — plural lowercase (e.g., `widgets`)
- `Features` — PascalCase plural (e.g., `Widgets`)
- `tableName` — Drizzle table import name (e.g., `widgets`)

## Template

```typescript
import { Injectable } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';

import { <tableName> } from '@/infra/drizzle/schema';
import {
  InjectDrizzle,
  type DrizzleDatabase,
} from '@/infra/drizzle/drizzle.module';
import type { UserId } from '@/infra/auth/auth.schema';
import { ServiceError } from '@/domain/shared/errors/service.error';
import { omitUndefined } from '@/domain/shared/helpers/omit-undefined';

import {
  <Feature>,
  <Feature>Status,
  type <Feature>Id,
  type Create<Feature>,
  type Update<Feature>,
} from './<feature>.model';

@Injectable()
export class <Features>Service {
  constructor(
    @InjectDrizzle() private readonly db: DrizzleDatabase,
  ) {}

  /** Returns all <features> for the given owner, ordered by createdAt descending. */
  async all(ownerId: UserId): Promise<<Feature>[]> {
    try {
      const rows = await this.db
        .select()
        .from(<tableName>)
        .where(eq(<tableName>.ownerId, ownerId))
        .orderBy(desc(<tableName>.createdAt));
      return <Feature>.fromRowset(rows);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('all <features>', error);
    }
  }

  /** Returns a single <feature> by id and owner, or null if not found. */
  async single(
    ownerId: UserId,
    id: <Feature>Id,
  ): Promise<<Feature> | null> {
    try {
      const [row] = await this.db
        .select()
        .from(<tableName>)
        .where(and(eq(<tableName>.id, id), eq(<tableName>.ownerId, ownerId)));
      return row ? new <Feature>(row) : null;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('single <feature>', error);
    }
  }

  /** Creates a new <feature> and returns the persisted domain model. */
  async create(ownerId: UserId, data: Create<Feature>): Promise<<Feature>> {
    try {
      const [row] = await this.db
        .insert(<tableName>)
        .values({
          ownerId,
          name: data.name,
          description: data.description,
          status: data.status,
        })
        .returning();

      if (!row) {
        throw ServiceError.consistency('create <feature>', 'unknown');
      }

      return new <Feature>(row);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('create <feature>', error);
    }
  }

  /** Updates an existing <feature>. Throws NOT_FOUND if it does not exist. */
  async update(
    ownerId: UserId,
    id: <Feature>Id,
    data: Update<Feature>,
  ): Promise<<Feature>> {
    try {
      const changes = omitUndefined(data);

      const [row] = await this.db
        .update(<tableName>)
        .set(changes)
        .where(and(eq(<tableName>.id, id), eq(<tableName>.ownerId, ownerId)))
        .returning();

      if (!row) {
        throw ServiceError.notFound('<Feature>', id);
      }

      return new <Feature>(row);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('update <feature>', error);
    }
  }

  /** Hard-deletes a <feature>. Throws NOT_FOUND if it does not exist. */
  async delete(ownerId: UserId, id: <Feature>Id): Promise<void> {
    try {
      const result = await this.db
        .delete(<tableName>)
        .where(and(eq(<tableName>.id, id), eq(<tableName>.ownerId, ownerId)));

      if (result.rowCount === 0) {
        throw ServiceError.notFound('<Feature>', id);
      }
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('delete <feature>', error);
    }
  }

  /** Archives an active <feature>. Throws CONFLICT if already archived, NOT_FOUND if missing. */
  async archive(ownerId: UserId, id: <Feature>Id): Promise<<Feature>> {
    try {
      const existing = await this.single(ownerId, id);

      if (!existing) {
        throw ServiceError.notFound('<Feature>', id);
      }

      if (existing.status === <Feature>Status.archived) {
        throw ServiceError.conflict(
          `<Feature> '${id}' is already archived`,
        );
      }

      const [row] = await this.db
        .update(<tableName>)
        .set({ status: <Feature>Status.archived })
        .where(and(eq(<tableName>.id, id), eq(<tableName>.ownerId, ownerId)))
        .returning();

      if (!row) {
        throw ServiceError.consistency('archive <feature>', id);
      }

      return new <Feature>(row);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('archive <feature>', error);
    }
  }

  /** Restores an archived <feature>. Throws CONFLICT if not archived, NOT_FOUND if missing. */
  async restore(ownerId: UserId, id: <Feature>Id): Promise<<Feature>> {
    try {
      const existing = await this.single(ownerId, id);

      if (!existing) {
        throw ServiceError.notFound('<Feature>', id);
      }

      if (existing.status === <Feature>Status.active) {
        throw ServiceError.conflict(`<Feature> '${id}' is not archived`);
      }

      const [row] = await this.db
        .update(<tableName>)
        .set({ status: <Feature>Status.active })
        .where(and(eq(<tableName>.id, id), eq(<tableName>.ownerId, ownerId)))
        .returning();

      if (!row) {
        throw ServiceError.consistency('restore <feature>', id);
      }

      return new <Feature>(row);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('restore <feature>', error);
    }
  }
}
```

## Adapt the template

- Replace `<feature>` / `<Feature>` / `<features>` / `<Features>` / `<tableName>` with actual names.
- Adjust `.values({...})` in `create` to match the actual domain fields.
- If the feature has no status enum, remove `archive`, `restore` methods, and the `<Feature>Status` import.

## Verify

Read `.claude/rules/service.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
