# Rules + Skills Refactoring Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monolithic scaffold-feature skill with matched rule/skill pairs per domain layer, extract domain models to their own file, and add built-in verification.

**Architecture:** Each domain area gets a constraint rule (passive, auto-loaded by paths:) and a template skill (active, invoked on demand). Skills include a verify step that reads the matching rule and checks compliance. An orchestrator skill ties them together.

**Tech Stack:** Claude Code rules (.claude/rules/*.md), Claude Code skills (.claude/skills/*/SKILL.md)

---

## Task 1: Cleanup

Delete all widgets artifacts and the old monolithic skill.

- [ ] Delete `src/domain/widgets/` directory entirely
- [ ] Delete widgets migration: `.database/public/20260328125328_known_mariko_yashida/`
- [ ] Revert `src/domain/features.module.ts` to empty imports
- [ ] Revert `src/infra/drizzle/schema.ts` — remove widget enum + table, keep only shared helpers
- [ ] Revert `src/infra/drizzle/types.ts` — remove WidgetRow/NewWidgetRow, keep only the header comment and schema import
- [ ] Revert `src/infra/drizzle/relations.ts` — keep empty relations (already clean)
- [ ] Delete `test/rest/widgets-rest.e2e-spec.ts`
- [ ] Delete `test/graphql/widgets-gql.e2e-spec.ts`
- [ ] Delete `docs/superpowers/plans/2026-03-28-widgets.md`
- [ ] Delete `docs/superpowers/specs/2026-03-28-widgets-design.md`
- [ ] Delete current `.claude/skills/scaffold-feature/SKILL.md`
- [ ] Commit: `chore: remove widgets test feature and monolithic scaffold skill`

### File content: `src/domain/features.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  imports: [],
})
export class FeaturesModule {}
```

### File content: `src/infra/drizzle/schema.ts`

```typescript
import {
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/** Shared timestamp columns: `created_at` (auto-set on insert) and `updated_at` (auto-set on update). */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }).$onUpdate(() => new Date()),
};

/** UUIDv7 primary key column, auto-generated via the `uuidv7()` PostgreSQL function. */
export const primaryId = uuid('id')
  .primaryKey()
  .default(sql`uuidv7()`);
```

### File content: `src/infra/drizzle/types.ts`

```typescript
/**
 * Typed row definitions for Drizzle ORM queries.
 *
 * `*Row` types extend `$inferSelect` with optional relation properties — these are
 * only populated when the query uses `with:` to eagerly load relations.
 * `New*Row` types use `$inferInsert` for insert operations.
 */
import * as schema from './schema';
```

---

## Task 2: Create `model.md` rule + update `architecture.md`

Create the new domain model rule and update architecture to reference the new file.

- [ ] Create `.claude/rules/model.md`
- [ ] Update `.claude/rules/architecture.md` — add `<feature>.model.ts` to directory listing, update file naming note
- [ ] Update `.claude/rules/service.md` — remove "Domain model" section (moves to model.md), keep only service-class concerns
- [ ] Commit: `docs(rules): add model rule, update architecture and service rules`

### File content: `.claude/rules/model.md`

```markdown
---
paths:
  - "src/domain/**/*.model.ts"
---

# Domain Model

> Each feature has a `<feature>.model.ts` file (singular name) containing the domain class, ID type alias, enum, and Create/Update types. The matching `/scaffold-model` skill provides code templates.

## Constructor mapping

- !IMPORTANT: The constructor accepts the database row type and maps each field explicitly (`this.name = row.name`). NEVER use `Object.assign(this, row)` — domain fields must be individually mapped to allow renaming, type casting, and default values.
- Required fields use definite assignment (`!`), optional fields use property defaults.

## Static factory

- Always provide `static fromRowset(rows: FooRow[]): Foo[]` for array mapping — delegates to `new Foo(row)` via `.map()`.

## ID type alias

- Export a type alias: `export type FooId = FooRow['id']` — derived from the row type.

## Enum via `createEnumObject`

- Import the pgEnum values from `@/infra/drizzle/schema`.
- Create the enum object: `export const FooStatus = createEnumObject(fooStatus.enumValues)`.
- Export the key type: `export type FooStatus = keyof typeof FooStatus`.
- Import `createEnumObject` from `@/domain/shared/helpers/enum-object`.

## Create / Update types

- `CreateFoo` = `Omit<Foo, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>` — all fields needed to create.
- `UpdateFoo` = `Partial<Omit<CreateFoo, 'status'>>` — only mutable non-status fields.

## Documentation

- JSDoc (`/** */`) on the class and every property.

## Nullability

- !IMPORTANT: `updatedAt` is `Date | null` — it is null on initial insert (the `$onUpdate` callback only fires on updates).

## Anti-patterns

- NEVER use `Object.assign(this, row)` or spread to populate domain fields.
- NEVER import row types at the controller/resolver layer — only the model types.
- NEVER define the domain model inside the service file — it lives in its own `<feature>.model.ts`.
```

### File content: `.claude/rules/architecture.md`

```markdown
---
paths:
  - "src/domain/**/*"
---

# Domain Module Architecture

> Cross-cutting constraints for the domain layer. Individual layer rules: `model.md`, `service.md`, `rest.md`, `graphql.md`. The `/scaffold-feature` orchestrator skill provides full scaffolding.

## Directory structure

```
src/domain/<feature>/
├── <feature>.model.ts            # Domain model, ID type, enum, Create/Update types
├── <feature>.service.ts          # Service class (imports from model)
├── <feature>.service.spec.ts     # Unit tests
├── <feature>.module.ts           # NestJS module
├── stubs/
│   └── test-<feature>.factory.ts
├── rest/
│   ├── <feature>.controller.ts
│   ├── requests/
│   │   ├── create-<feature>.request.ts
│   │   └── update-<feature>.request.ts
│   └── responses/
│       └── <feature>.response.ts
└── graphql/
    ├── <feature>.resolver.ts
    ├── <feature>.object.ts
    └── <feature>.input.ts
```

## Naming

- Module class: `<Features>Module` (plural + "Module"), e.g. `WidgetsModule`
- !IMPORTANT: File names use the **singular** feature name for model + GraphQL types (`widget.model.ts`, `widget.object.ts`, `widget.input.ts`), **plural** for service/controller/resolver (`widgets.service.ts`, `widgets.controller.ts`, `widgets.resolver.ts`).

## Cross-module dependencies

- One domain module CAN depend on another by importing its NestJS module and injecting its exported service.
- Infrastructure modules (`src/infra/`) provide cross-cutting concerns.
- Domain modules import from infra via `@/infra/...`.
- !IMPORTANT: Infra modules NEVER import from domain.

## Layering rules

- **Model** is the single source of truth for the domain entity, ID type, and Create/Update types.
- **Service** is the single source of truth for business logic. Imports domain types from the model file.
- **Controllers and Resolvers** delegate to the service and transform results.
- **Request classes** own input validation (class-validator) and provide a `toDomain()` method.
- **Response classes** and **ObjectTypes** provide a `static fromDomain()` factory.
- !IMPORTANT: Controllers and resolvers NEVER access the database directly.

## Shared utilities

- `@src/domain/shared/errors/service.error.ts` — `ServiceError` with typed error codes
- `@src/domain/shared/errors/error.filter.ts` — `ServiceErrorFilter` exception filter
- `@src/domain/shared/helpers/omit-undefined.ts` — strips undefined keys from update objects
- `@src/domain/shared/helpers/enum-object.ts` — `createEnumObject()` for string literal enums
- `@src/domain/shared/decorators/UUIDv7-param.decorator.ts` — `@UUIDv7Param()` for id params

## Anti-patterns

- NEVER access the database from controllers or resolvers.
- NEVER create circular module dependencies.
- NEVER define the domain model inside the service file — it lives in `<feature>.model.ts`.
```

### File content: `.claude/rules/service.md`

```markdown
---
paths:
  - "src/domain/**/*.service.ts"
---

# Service Layer

> Constraints for service classes. Domain model conventions live in `model.md`. The matching `/scaffold-service` skill provides code templates.

## Injection

- Inject `DrizzleDatabase` via `@InjectDrizzle()` from `@/infra/drizzle/drizzle.module`.
- Import tables from `@/infra/drizzle/schema`, row types from `@/infra/drizzle/types`.
- Import domain model, ID type, and Create/Update types from the `<feature>.model.ts` file.

## Method naming

- !IMPORTANT: Use these exact method names: `all`, `single`, `exists`, `create`, `update`, `delete`, `archive`, `restore`. Do NOT use `findAll`, `findOne`, `findById`, or similar.

## Ownership scoping

- !IMPORTANT: Every query MUST filter by `ownerId`. Never expose data across owners.

## Error handling

Every method wraps its body in try/catch. Re-throw `ServiceError` as-is (`instanceof` check) before wrapping with `ServiceError.database()`.

| Situation                                    | Action                                                        |
|----------------------------------------------|---------------------------------------------------------------|
| `single` not found                           | Return `null` (do not throw)                                  |
| `update`/`archive`/`restore` returning empty | `ServiceError.notFound()` -- code: `NOT_FOUND`                |
| `delete` with `rowCount === 0`               | `ServiceError.notFound()` -- code: `NOT_FOUND`                |
| Write succeeded but re-fetch returns nothing | `ServiceError.consistency()` -- code: `CONSISTENCY_ERROR`     |
| FK reference not owned by user               | `ServiceError.invalidReference()` -- code: `INVALID_REFERENCE`|
| Unique constraint or business rule violation | `ServiceError.conflict()` -- code: `CONFLICT`                 |
| Unexpected database failure                  | `ServiceError.database()` -- code: `DATABASE_ERROR`           |

## Anti-patterns

- NEVER return `undefined` from `single()` -- return `null`.
- NEVER throw not-found in `single()` -- return `null`.
- NEVER spread the entire update object into `.set()` -- use `omitUndefined()`.
- NEVER wrap `ServiceError` -- always check `instanceof ServiceError` first in catch blocks.
- NEVER access another module's tables directly -- always import the exported service.
- NEVER define domain model types in the service file -- they belong in `<feature>.model.ts`.
```

---

## Task 3: Restore richness to existing rules

Update each rule with `!IMPORTANT` markers, explicit import paths, `@file/path` references, and complementary skill references.

- [ ] Update `.claude/rules/rest.md`
- [ ] Update `.claude/rules/graphql.md`
- [ ] Update `.claude/rules/database.md`
- [ ] Update `.claude/rules/unit-testing.md`
- [ ] Update `.claude/rules/e2e-testing.md`
- [ ] Commit: `docs(rules): enrich existing rules with import paths and skill references`

### File content: `.claude/rules/rest.md`

```markdown
---
paths:
  - "src/domain/**/rest/**"
---

# REST Controller Layer

> Constraints for REST controllers and DTOs. The matching `/scaffold-rest` skill provides code templates.

## Controller conventions

- `@Controller('<plural-name>')` -- route path is plural, lowercase (e.g., `widgets`, `category-groups`)
- `@UseFilters(ServiceErrorFilter)` from `@/domain/shared/errors/error.filter`
- `@OpenApiController(tag)` from `@/tools/openapi/openapi-controller.decorator`
- `@CurrentUser() user: AuthUser` — both imported from `@/infra/auth/auth.decorators`
- `@UUIDv7Param('id')` from `@/domain/shared/decorators/UUIDv7-param.decorator` for path params
- Import domain model, ID type, and Create/Update types from `@/domain/<feature>/<feature>.model` (not the service file).

## Request DTOs

- !IMPORTANT: Create and Update request DTOs are always separate classes (NEVER use `PartialType`).
- !IMPORTANT: Every request class MUST have a `toDomain()` method that converts to the service-layer type (`CreateFoo` / `UpdateFoo` from the model file).
- !IMPORTANT: `@ApiSchema({ name })` on every request and response DTO for OpenAPI schema naming.

## OpenAPI decorators

- `@OpenApiController(tag)` -- class-level: tags, bearer auth, common errors. See `@src/tools/openapi/openapi-controller.decorator.ts`.
- `@OpenApiEndpoint(config)` -- method-level: summary, response type, params, errors. See `@src/tools/openapi/openapi-endpoint.decorator.ts`.

## Response DTOs

- `static fromDomain(entity)` factory constructs the response -- assigns fields directly.
- `static fromDomainList(entities)` for list endpoints -- delegates to `fromDomain()` via `.map()`.

## Anti-patterns

- NEVER access the database from controllers -- delegate all data access to the service layer.
- NEVER throw `ServiceError` from controllers -- let `ServiceErrorFilter` handle errors from services.
- NEVER manually validate UUID path params -- use `@UUIDv7Param()`.
- NEVER return 400 for validation errors -- the global `ValidationPipe` returns 422.
- NEVER construct response objects with `new` and setters -- use the static `fromDomain()` factory.
```

### File content: `.claude/rules/graphql.md`

```markdown
---
paths:
  - "src/domain/**/graphql/**"
---

# GraphQL Layer (Apollo)

> Constraints for GraphQL resolvers, object types, and input types. The matching `/scaffold-graphql` skill provides code templates.

## Naming

| Type       | File pattern           | Class name                               |
|------------|------------------------|------------------------------------------|
| Resolver   | `<module>.resolver.ts` | `<Module>sResolver` (plural)             |
| ObjectType | `<module>.object.ts`   | `<Module>Object` (singular)              |
| InputType  | `<module>.input.ts`    | `Create<Module>Input`, `Update<Module>Input` |
| Enum       | (in object file)       | `<Module>TypeEnum`                       |

- !IMPORTANT: File names are **singular** for types (`widget.object.ts`), **plural** for the resolver (`widgets.resolver.ts`).
- !IMPORTANT: Unlike REST, GraphQL `UpdateFooInput` extends `PartialType(CreateFooInput)` to make all fields optional.
- Import domain model from `@/domain/<feature>/<feature>.model` (not the service file) for `fromDomain()`.
- Import `PartialType` from `@nestjs/graphql` (not `@nestjs/swagger`).

## Enum registration

- Define a TypeScript enum with SCREAMING_CASE keys mapping to lowercase database values (e.g., `ACTIVE = 'active'`).
- Register via `registerEnumType(FooTypeEnum, { name: 'FooType' })`.
- !IMPORTANT: Place the enum definition and registration in the object type file (`<feature>.object.ts`), not in a separate file.

## Resolver conventions

- `@Resolver(() => FooObject)` — always specify the ObjectType in the decorator argument.
- `@UseFilters(ServiceErrorFilter)` on the resolver class — from `@/domain/shared/errors/error.filter`.
- Throw `NotFoundException` in the resolver for not-found single queries.
- `ServiceError` instances propagate through the filter automatically.
- Import service from `../<feature>.service` (relative) and types from `../<feature>.model` (relative).

## Anti-patterns

- NEVER reuse REST/tables enum types in GraphQL -- register separate TypeScript enums with `registerEnumType()`.
- NEVER convert BigInt in InputTypes -- convert in the resolver (`BigInt(input.field)`).
- NEVER use plain spread for update mutations -- use conditional spread (`...(input.field !== undefined && { field: input.field })`) to exclude undefined fields.
- NEVER skip `@UseFilters(ServiceErrorFilter)` on resolvers.
```

### File content: `.claude/rules/database.md`

```markdown
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
```

### File content: `.claude/rules/unit-testing.md`

```markdown
---
paths:
  - "src/**/*.spec.ts"
---

# Unit Testing

> Constraints for unit tests. The matching `/scaffold-unit-test` skill provides code templates.

- !IMPORTANT: Real PostgreSQL via Testcontainers -- no mocks, no test doubles for the database.

## What to test

1. **Happy path** -- correct result with valid input
2. **Edge cases** -- minimal fields, all fields, boundary values
3. **Validation errors** -- missing required fields, invalid types, invalid formats
4. **Not found** -- behavior with `nonExistentId()` (null return or `ServiceError.notFound`)
5. **Partial updates** -- only specified fields change, others preserved
6. **Owner isolation** -- different owner's data is not accessible

## Test setup

- `beforeAll`: create context via `TestModuleBuilder.create(FeatureModule)`, get service via `ctx.get(Service)`, get `testUserId` via `await ctx.auth.defaultUserId()`. Use 60s timeout.
- `afterAll`: call `ctx.teardown()`
- `afterEach`: clean up test data by deleting domain rows (import table from `@/infra/drizzle/schema`)

## Test utilities

- `TestModuleBuilder.create(Module)` from `@/testing/test-module.builder` -- bootstraps isolated NestJS module with Testcontainers (no HTTP server). Optional `overrides` array for replacing providers.
- `ctx.get(Token)` -- resolve any provider from the compiled module
- `ctx.database` -- DrizzleDatabase for test data setup/teardown
- `ctx.auth.defaultUserId()` -- returns default test user ID (async, creates on first call)
- `ctx.auth.createUser()` -- creates a new auth user, returns userId (for multi-owner tests)
- `ctx.auth.dropUser(id)` -- removes auth user (cascades deletes)
- `nonExistentId()` -- from `@/testing/test-constants`, returns the nil UUID

## Test data factories

- Factory functions live in `@/domain/<feature>/stubs/test-<feature>.factory`
- Returns the raw database row (not a domain model), uses `NewFooRow` for overrides
- Factories do NOT auto-create dependencies -- create prerequisites first
- !IMPORTANT: Factory function name follows `createTest<Feature>` pattern (e.g., `createTestWidget`)

## Test structure

- !IMPORTANT: Use nested `describe` blocks with the `given/when/then` pattern.
- One `describe` block per service method (named after the method: `describe('all', ...)`)
- Test names start with `given ...` or describe the scenario directly

## Anti-patterns

- NEVER use `vi.mock()` or `vi.fn()` for database or service dependencies.
- NEVER share test data between test groups -- each test creates its own data.
```

### File content: `.claude/rules/e2e-testing.md`

```markdown
---
paths:
  - "test/**/*.e2e-spec.ts"
---

# E2E Testing

> Constraints for end-to-end tests. The matching `/scaffold-e2e-test` skill provides code templates.

## Directory structure

```
test/
├── rest/<feature>-rest.e2e-spec.ts       # REST e2e tests
├── graphql/<feature>-gql.e2e-spec.ts     # GraphQL e2e tests
```

- !IMPORTANT: Real database via Testcontainers -- no mocking.

## Test setup timing

- `beforeAll`/`afterAll` for read-only test groups (GET endpoints)
- `beforeEach`/`afterEach` for mutating test groups (POST, PATCH, DELETE)

## What to test

1. **Happy path** -- correct status code and response body
2. **Validation errors** -- missing required fields, invalid types -> 422
3. **Not found** -- valid UUID that doesn't exist -> 404
4. **Invalid UUID** -- malformed path parameter -> 400
5. **Side effects** -- verify deletion via GET after DELETE, verify archive sets `archivedAt`

## Test utilities

- `TestApplicationContext.create()` from `test/test-application.context` -- bootstraps full NestJS app with Testcontainers (120s timeout)
- `await app.client()` -- supertest agent with auth headers (async)
- `app.executeGraphql<T>({ query, variables })` -- GraphQL query/mutation helper
- `app.database` -- DrizzleDatabase for setup/teardown
- `app.auth` -- TestAuthContext for test user management (`defaultUserId()`, `createUser()`, `dropUser()`)
- `ErrorResponse` -- interface for typed error assertions (from `@/testing/error.response`)
- `NON_EXISTENT_UUID` -- valid UUIDv7 that matches no entity (from `@/testing/test-constants`)

## Test structure

- !IMPORTANT: Use nested `describe` blocks: outer = endpoint (e.g., `GET /widgets`), inner = scenario (e.g., `given no existing widgets`).
- !IMPORTANT: REST and GraphQL tests are in SEPARATE files -- never mix them.

## Anti-patterns

- NEVER use `vi.mock()` or any mocking -- tests hit the real database.
- NEVER share test data between describe blocks -- each group creates and cleans its own data.
```

---

## Task 4: Create scaffold-model skill

- [ ] Create `.claude/skills/scaffold-model/SKILL.md`
- [ ] Commit: `feat(skills): add scaffold-model skill`

### File content: `.claude/skills/scaffold-model/SKILL.md`

````markdown
---
name: scaffold-model
description: Create a domain model file with entity class, ID type, enum, and Create/Update types
---

# scaffold-model

Creates `src/domain/<feature>/<feature>.model.ts` with:
- Enum via `createEnumObject`
- ID type alias
- Domain model class with explicit constructor mapping
- `static fromRowset()` for array mapping
- `CreateFoo` and `UpdateFoo` types

## Inputs

- `feature` — feature name (singular lowercase, e.g., `widget`)
- `Feature` — PascalCase entity name (e.g., `Widget`)
- `fields` — list of domain fields (name, type, required/optional)
- `enumName` — optional status/type enum name
- `enumValues` — optional enum values array

## Template

```typescript
import { <enumName> } from '@/infra/drizzle/schema';
import type { <Feature>Row } from '@/infra/drizzle/types';
import { createEnumObject } from '@/domain/shared/helpers/enum-object';

// ── Enum ─────────────────────────────────────────────────────────────
export const <Feature>Status = createEnumObject(<enumName>.enumValues);
export type <Feature>Status = keyof typeof <Feature>Status;

// ── Types ────────────────────────────────────────────────────────────
export type <Feature>Id = <Feature>Row['id'];

/** Domain model for a <feature>. */
export class <Feature> {
  /** Unique identifier (UUID v7). */
  id!: <Feature>Id;
  /** Owner user ID. */
  owner!: string;
  /** Display name. */
  name!: string;
  /** Optional description. */
  description: string | null = null;
  /** <Feature> status. */
  status!: <Feature>Status;
  /** Timestamp of creation. */
  createdAt: Date = new Date();
  /** Timestamp of last update. */
  updatedAt: Date | null = null;

  constructor(row: <Feature>Row) {
    this.id = row.id;
    this.owner = row.ownerId;
    this.name = row.name;
    this.description = row.description;
    this.status = row.status;
    this.createdAt = row.createdAt;
    this.updatedAt = row.updatedAt;
  }

  /** Maps an array of database rows to domain models. */
  static fromRowset(rows: <Feature>Row[]): <Feature>[] {
    return rows.map((row) => new <Feature>(row));
  }
}

export type Create<Feature> = Omit<
  <Feature>,
  'id' | 'ownerId' | 'createdAt' | 'updatedAt'
>;
export type Update<Feature> = Partial<Omit<Create<Feature>, 'status'>>;
```

## Adapt the template

- Replace `<feature>` / `<Feature>` with actual names.
- Adjust fields to match the domain entity — add/remove properties as needed.
- If no enum, remove the enum section entirely.
- Ensure every field in the constructor is explicitly mapped from the row.

## Verify

Read `.claude/rules/model.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
````

---

## Task 5: Create scaffold-service skill

- [ ] Create `.claude/skills/scaffold-service/SKILL.md`
- [ ] Commit: `feat(skills): add scaffold-service skill`

### File content: `.claude/skills/scaffold-service/SKILL.md`

````markdown
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

- `feature` — feature name (singular lowercase, e.g., `widget`)
- `Feature` — PascalCase entity name (e.g., `Widget`)
- `features` — plural lowercase (e.g., `widgets`)
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
import type { <Feature>Row } from '@/infra/drizzle/types';
import type { UserId } from '@/infra/auth/auth.schema';
import { ServiceError } from '@/domain/shared/errors/service.error';
import { omitUndefined } from '@/domain/shared/helpers/omit-undefined';

import {
  <Feature>,
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
- If the feature has no status enum, remove `archive` and `restore` methods.
- Add the `<Feature>Status` import from the model file if archive/restore are present.

## Verify

Read `.claude/rules/service.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
````

---

## Task 6: Create scaffold-rest skill

- [ ] Create `.claude/skills/scaffold-rest/SKILL.md`
- [ ] Commit: `feat(skills): add scaffold-rest skill`

### File content: `.claude/skills/scaffold-rest/SKILL.md`

````markdown
---
name: scaffold-rest
description: Create REST controller, request DTOs, and response DTO with OpenAPI decorators
---

# scaffold-rest

Creates the REST layer for a feature:
- `src/domain/<feature>/rest/<features>.controller.ts`
- `src/domain/<feature>/rest/requests/create-<feature>.request.ts`
- `src/domain/<feature>/rest/requests/update-<feature>.request.ts`
- `src/domain/<feature>/rest/responses/<feature>.response.ts`

## Inputs

- `feature` — singular lowercase (e.g., `widget`)
- `Feature` — PascalCase (e.g., `Widget`)
- `features` — plural lowercase (e.g., `widgets`)
- `Features` — PascalCase plural (e.g., `Widgets`)

## Template: Controller

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  NotFoundException,
} from '@nestjs/common';

import { ServiceErrorFilter } from '@/domain/shared/errors/error.filter';
import { UUIDv7Param } from '@/domain/shared/decorators/UUIDv7-param.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '@/infra/auth/auth.decorators';
import { OpenApiController } from '@/tools/openapi/openapi-controller.decorator';
import { OpenApiEndpoint } from '@/tools/openapi/openapi-endpoint.decorator';

import type { <Feature>Id } from '../<feature>.model';
import { <Features>Service } from '../<features>.service';
import { Create<Feature>Request } from './requests/create-<feature>.request';
import { Update<Feature>Request } from './requests/update-<feature>.request';
import { <Feature>Response } from './responses/<feature>.response';

@Controller('<features>')
@UseFilters(ServiceErrorFilter)
@OpenApiController('<Features>')
export class <Features>Controller {
  constructor(private readonly <features>Service: <Features>Service) {}

  @Get()
  @OpenApiEndpoint({
    summary: 'List all <features>',
    type: [<Feature>Response],
  })
  async findAll(
    @CurrentUser() user: AuthUser,
  ): Promise<<Feature>Response[]> {
    const <features> = await this.<features>Service.all(user.id);
    return <Feature>Response.fromDomainList(<features>);
  }

  @Get(':id')
  @OpenApiEndpoint({
    summary: 'Get a <feature> by ID',
    type: <Feature>Response,
  })
  async findOne(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: <Feature>Id,
  ): Promise<<Feature>Response> {
    const <feature> = await this.<features>Service.single(user.id, id);
    if (!<feature>)
      throw new NotFoundException(`<Feature> with id '${id}' not found`);
    return <Feature>Response.fromDomain(<feature>);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @OpenApiEndpoint({
    summary: 'Create a new <feature>',
    status: HttpStatus.CREATED,
    type: <Feature>Response,
  })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() request: Create<Feature>Request,
  ): Promise<<Feature>Response> {
    const <feature> = await this.<features>Service.create(
      user.id,
      request.toDomain(),
    );
    return <Feature>Response.fromDomain(<feature>);
  }

  @Patch(':id')
  @OpenApiEndpoint({
    summary: 'Update a <feature>',
    type: <Feature>Response,
  })
  async update(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: <Feature>Id,
    @Body() request: Update<Feature>Request,
  ): Promise<<Feature>Response> {
    const <feature> = await this.<features>Service.update(
      user.id,
      id,
      request.toDomain(),
    );
    return <Feature>Response.fromDomain(<feature>);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @OpenApiEndpoint({
    summary: 'Delete a <feature>',
    status: HttpStatus.NO_CONTENT,
  })
  async remove(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: <Feature>Id,
  ): Promise<void> {
    await this.<features>Service.delete(user.id, id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.CREATED)
  @OpenApiEndpoint({
    summary: 'Archive a <feature>',
    status: HttpStatus.CREATED,
    type: <Feature>Response,
  })
  async archive(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: <Feature>Id,
  ): Promise<<Feature>Response> {
    const <feature> = await this.<features>Service.archive(user.id, id);
    return <Feature>Response.fromDomain(<feature>);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.CREATED)
  @OpenApiEndpoint({
    summary: 'Restore an archived <feature>',
    status: HttpStatus.CREATED,
    type: <Feature>Response,
  })
  async restore(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: <Feature>Id,
  ): Promise<<Feature>Response> {
    const <feature> = await this.<features>Service.restore(user.id, id);
    return <Feature>Response.fromDomain(<feature>);
  }
}
```

## Template: CreateRequest

```typescript
import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  Length,
  ValidateIf,
} from 'class-validator';

import {
  <Feature>Status,
  type Create<Feature>,
  type <Feature>Status as <Feature>StatusType,
} from '@/domain/<feature>/<feature>.model';

@ApiSchema({ name: 'Create<Feature>Request' })
export class Create<Feature>Request {
  @ApiProperty({ description: 'Display name of the <feature>' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiProperty({
    description: 'Optional description',
    required: false,
    nullable: true,
  })
  @ValidateIf((o) => o.description !== null)
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    description: '<Feature> status',
    required: false,
    enum: Object.values(<Feature>Status),
  })
  @IsOptional()
  @IsIn(Object.values(<Feature>Status))
  status?: <Feature>StatusType;

  toDomain(): Create<Feature> {
    return {
      name: this.name,
      description: this.description ?? null,
      status: this.status ?? 'active',
    };
  }
}
```

## Template: UpdateRequest

```typescript
import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  Length,
  ValidateIf,
} from 'class-validator';

import { type Update<Feature> } from '@/domain/<feature>/<feature>.model';

@ApiSchema({ name: 'Update<Feature>Request' })
export class Update<Feature>Request {
  @ApiProperty({
    description: 'Display name of the <feature>',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiProperty({
    description: 'Optional description',
    required: false,
    nullable: true,
  })
  @ValidateIf((o) => o.description !== null)
  @IsOptional()
  @IsString()
  description?: string | null;

  toDomain(): Update<Feature> {
    return {
      name: this.name,
      description: this.description,
    };
  }
}
```

## Template: Response

```typescript
import { ApiSchema, ApiProperty } from '@nestjs/swagger';

import {
  <Feature>,
  type <Feature>Status,
} from '@/domain/<feature>/<feature>.model';

@ApiSchema({ name: '<Feature>Response' })
export class <Feature>Response {
  @ApiProperty({ description: 'Unique identifier (UUIDv7)' })
  id!: string;

  @ApiProperty({ description: 'Display name of the <feature>' })
  name!: string;

  @ApiProperty({
    description: 'Optional description',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ description: '<Feature> status' })
  status!: <Feature>Status;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    nullable: true,
  })
  updatedAt!: Date | null;

  static fromDomain(entity: <Feature>): <Feature>Response {
    const response = new <Feature>Response();
    response.id = entity.id;
    response.name = entity.name;
    response.description = entity.description;
    response.status = entity.status;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    return response;
  }

  static fromDomainList(entities: <Feature>[]): <Feature>Response[] {
    return entities.map((e) => <Feature>Response.fromDomain(e));
  }
}
```

## Adapt the templates

- Replace all `<feature>` / `<Feature>` / `<features>` / `<Features>` with actual names.
- Adjust request fields to match the domain's `CreateFoo` / `UpdateFoo` types.
- Adjust response fields to match the domain model properties.
- If no status enum, remove the status field from CreateRequest and its `@IsIn` validator.
- If no archive/restore, remove those controller methods.

## Verify

Read `.claude/rules/rest.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
````

---

## Task 7: Create scaffold-graphql skill

- [ ] Create `.claude/skills/scaffold-graphql/SKILL.md`
- [ ] Commit: `feat(skills): add scaffold-graphql skill`

### File content: `.claude/skills/scaffold-graphql/SKILL.md`

````markdown
---
name: scaffold-graphql
description: Create GraphQL resolver, object type with enum registration, and input types
---

# scaffold-graphql

Creates the GraphQL layer for a feature:
- `src/domain/<feature>/graphql/<feature>.object.ts`
- `src/domain/<feature>/graphql/<feature>.input.ts`
- `src/domain/<feature>/graphql/<features>.resolver.ts`

## Inputs

- `feature` — singular lowercase (e.g., `widget`)
- `Feature` — PascalCase (e.g., `Widget`)
- `features` — plural lowercase (e.g., `widgets`)
- `Features` — PascalCase plural (e.g., `Widgets`)

## Template: ObjectType

```typescript
import {
  Field,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import { <Feature> } from '@/domain/<feature>/<feature>.model';

export enum <Feature>StatusEnum {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

registerEnumType(<Feature>StatusEnum, {
  name: '<Feature>Status',
  description: 'Status of a <feature>',
});

@ObjectType({ description: 'A <feature> entity' })
export class <Feature>Object {
  @Field(() => ID, { description: 'Unique identifier (UUIDv7)' })
  id!: string;

  @Field(() => String, { description: 'Display name of the <feature>' })
  name!: string;

  @Field(() => String, {
    description: 'Optional description',
    nullable: true,
  })
  description!: string | null;

  @Field(() => <Feature>StatusEnum, { description: '<Feature> status' })
  status!: <Feature>StatusEnum;

  @Field(() => Date, { description: 'Creation timestamp' })
  createdAt!: Date;

  @Field(() => Date, {
    description: 'Last update timestamp',
    nullable: true,
  })
  updatedAt!: Date | null;

  static fromDomain(<feature>: <Feature>): <Feature>Object {
    const obj = new <Feature>Object();
    obj.id = <feature>.id;
    obj.name = <feature>.name;
    obj.description = <feature>.description;
    obj.status = <feature>.status as <Feature>StatusEnum;
    obj.createdAt = <feature>.createdAt;
    obj.updatedAt = <feature>.updatedAt;
    return obj;
  }

  static fromDomainList(<features>: <Feature>[]): <Feature>Object[] {
    return <features>.map((w) => <Feature>Object.fromDomain(w));
  }
}
```

## Template: InputTypes

```typescript
import { Field, InputType, PartialType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  Length,
  ValidateIf,
} from 'class-validator';

@InputType({ description: 'Input for creating a new <feature>' })
export class Create<Feature>Input {
  @Field(() => String, { description: 'Display name of the <feature>' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @Field(() => String, {
    description: 'Optional description',
    nullable: true,
  })
  @ValidateIf((o) => o.description !== null)
  @IsOptional()
  @IsString()
  description?: string | null;
}

@InputType({ description: 'Input for updating an existing <feature>' })
export class Update<Feature>Input extends PartialType(
  Create<Feature>Input,
) {}
```

## Template: Resolver

```typescript
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseFilters, NotFoundException } from '@nestjs/common';

import { ServiceErrorFilter } from '@/domain/shared/errors/error.filter';
import {
  CurrentUser,
  type AuthUser,
} from '@/infra/auth/auth.decorators';

import type { <Feature>Id } from '../<feature>.model';
import { <Features>Service } from '../<features>.service';
import { <Feature>Object } from './<feature>.object';
import { Create<Feature>Input, Update<Feature>Input } from './<feature>.input';

@Resolver(() => <Feature>Object)
@UseFilters(ServiceErrorFilter)
export class <Features>Resolver {
  constructor(private readonly <features>Service: <Features>Service) {}

  @Query(() => [<Feature>Object], { name: '<features>' })
  async <features>(
    @CurrentUser() user: AuthUser,
  ): Promise<<Feature>Object[]> {
    const <features> = await this.<features>Service.all(user.id);
    return <Feature>Object.fromDomainList(<features>);
  }

  @Query(() => <Feature>Object, { name: '<feature>' })
  async <feature>(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: <Feature>Id,
  ): Promise<<Feature>Object> {
    const <feature> = await this.<features>Service.single(user.id, id);
    if (!<feature>)
      throw new NotFoundException(`<Feature> with id '${id}' not found`);
    return <Feature>Object.fromDomain(<feature>);
  }

  @Mutation(() => <Feature>Object, {
    description: 'Create a new <feature>',
  })
  async create<Feature>(
    @CurrentUser() user: AuthUser,
    @Args('input') input: Create<Feature>Input,
  ): Promise<<Feature>Object> {
    const <feature> = await this.<features>Service.create(user.id, {
      name: input.name,
      description: input.description ?? null,
      status: 'active',
    });
    return <Feature>Object.fromDomain(<feature>);
  }

  @Mutation(() => <Feature>Object, {
    description: 'Update an existing <feature>',
  })
  async update<Feature>(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: <Feature>Id,
    @Args('input') input: Update<Feature>Input,
  ): Promise<<Feature>Object> {
    const <feature> = await this.<features>Service.update(user.id, id, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description ?? null,
      }),
    });
    return <Feature>Object.fromDomain(<feature>);
  }

  @Mutation(() => Boolean, { description: 'Delete a <feature>' })
  async delete<Feature>(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: <Feature>Id,
  ): Promise<boolean> {
    await this.<features>Service.delete(user.id, id);
    return true;
  }

  @Mutation(() => <Feature>Object, { description: 'Archive a <feature>' })
  async archive<Feature>(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: <Feature>Id,
  ): Promise<<Feature>Object> {
    const <feature> = await this.<features>Service.archive(user.id, id);
    return <Feature>Object.fromDomain(<feature>);
  }

  @Mutation(() => <Feature>Object, {
    description: 'Restore an archived <feature>',
  })
  async restore<Feature>(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: <Feature>Id,
  ): Promise<<Feature>Object> {
    const <feature> = await this.<features>Service.restore(user.id, id);
    return <Feature>Object.fromDomain(<feature>);
  }
}
```

## Adapt the templates

- Replace all `<feature>` / `<Feature>` / `<features>` / `<Features>` with actual names.
- Adjust enum values to match the actual domain enum.
- Adjust object type fields to match the domain model.
- Adjust input type fields to match CreateFoo requirements.
- Use conditional spread in update mutation for each updatable field.
- If no status enum, remove the enum definition/registration and archive/restore mutations.

## Verify

Read `.claude/rules/graphql.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
````

---

## Task 8: Create scaffold-database skill

- [ ] Create `.claude/skills/scaffold-database/SKILL.md`
- [ ] Commit: `feat(skills): add scaffold-database skill`

### File content: `.claude/skills/scaffold-database/SKILL.md`

````markdown
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

Ensure these imports are present at the top of `schema.ts`:
```typescript
import { index, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { withUserId } from '@/infra/auth/auth.schema';
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
- Add additional imports to `schema.ts` if new column types are used (e.g., `integer`, `boolean`).
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
````

---

## Task 9: Create scaffold-unit-test skill

- [ ] Create `.claude/skills/scaffold-unit-test/SKILL.md`
- [ ] Commit: `feat(skills): add scaffold-unit-test skill`

### File content: `.claude/skills/scaffold-unit-test/SKILL.md`

````markdown
---
name: scaffold-unit-test
description: Create unit tests for a domain service with Testcontainers and real database
---

# scaffold-unit-test

Creates `src/domain/<feature>/<features>.service.spec.ts` with:
- Test setup with TestModuleBuilder and Testcontainers
- Test data factory usage
- Tests for all CRUD methods
- Owner isolation tests

Also creates the test factory if it does not exist:
- `src/domain/<feature>/stubs/test-<feature>.factory.ts`

## Inputs

- `feature` — singular lowercase (e.g., `widget`)
- `Feature` — PascalCase (e.g., `Widget`)
- `features` — plural lowercase (e.g., `widgets`)
- `Features` — PascalCase plural (e.g., `Widgets`)

## Template: Unit test

```typescript
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest';
import { eq } from 'drizzle-orm';

import {
  TestModuleBuilder,
  TestModuleContext,
} from '@/testing/test-module.builder';
import { nonExistentId } from '@/testing/test-constants';
import { <features> } from '@/infra/drizzle/schema';

import { <Features>Module } from './<features>.module';
import { <Features>Service } from './<features>.service';
import { createTest<Feature> } from './stubs/test-<feature>.factory';

describe('<Features>Service', () => {
  let ctx: TestModuleContext;
  let service: <Features>Service;
  let testUserId: string;

  beforeAll(async () => {
    ctx = await TestModuleBuilder.create(<Features>Module);
    service = ctx.get(<Features>Service);
    testUserId = await ctx.auth.defaultUserId();
  }, 60_000);

  afterAll(async () => {
    await ctx.teardown();
  });

  afterEach(async () => {
    await ctx.database
      .delete(<features>)
      .where(eq(<features>.ownerId, testUserId));
  });

  // ── all ───────────────────────────────────────────────────────────

  describe('all', () => {
    it('given no <features>, returns an empty array', async () => {
      const result = await service.all(testUserId);
      expect(result).toEqual([]);
    });

    it('given multiple <features>, returns all of them', async () => {
      await createTest<Feature>(ctx.database, testUserId, {
        name: '<Feature> A',
      });
      await createTest<Feature>(ctx.database, testUserId, {
        name: '<Feature> B',
      });

      const result = await service.all(testUserId);
      expect(result).toHaveLength(2);
    });

    it('returns <features> ordered by createdAt descending', async () => {
      await createTest<Feature>(ctx.database, testUserId, {
        name: 'Older',
      });
      await createTest<Feature>(ctx.database, testUserId, {
        name: 'Newer',
      });

      const result = await service.all(testUserId);
      expect(result[0].name).toBe('Newer');
      expect(result[1].name).toBe('Older');
    });

    it('does not return <features> owned by another user', async () => {
      const otherUserId = await ctx.auth.createUser();
      await createTest<Feature>(ctx.database, otherUserId, {
        name: 'Other',
      });
      await createTest<Feature>(ctx.database, testUserId, {
        name: 'Mine',
      });

      const result = await service.all(testUserId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Mine');

      await ctx.database
        .delete(<features>)
        .where(eq(<features>.ownerId, otherUserId));
      await ctx.auth.dropUser(otherUserId);
    });
  });

  // ── single ────────────────────────────────────────────────────────

  describe('single', () => {
    it('given an existing <feature>, returns it', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
      );

      const result = await service.single(testUserId, created.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe('Test <Feature>');
    });

    it('given a non-existent id, returns null', async () => {
      const result = await service.single(
        testUserId,
        nonExistentId(),
      );
      expect(result).toBeNull();
    });

    it('does not return a <feature> owned by another user', async () => {
      const otherUserId = await ctx.auth.createUser();
      const other<Feature> = await createTest<Feature>(
        ctx.database,
        otherUserId,
      );

      const result = await service.single(testUserId, other<Feature>.id);
      expect(result).toBeNull();

      await ctx.database
        .delete(<features>)
        .where(eq(<features>.ownerId, otherUserId));
      await ctx.auth.dropUser(otherUserId);
    });
  });

  // ── create ────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a <feature> with default status', async () => {
      const result = await service.create(testUserId, {
        name: 'New <Feature>',
        description: null,
        status: 'active',
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('New <Feature>');
      expect(result.status).toBe('active');
      expect(result.owner).toBe(testUserId);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('creates a <feature> with all fields', async () => {
      const result = await service.create(testUserId, {
        name: 'Full <Feature>',
        description: 'A detailed description',
        status: 'active',
      });

      expect(result.name).toBe('Full <Feature>');
      expect(result.description).toBe('A detailed description');
    });
  });

  // ── update ────────────────────────────────────────────────────────

  describe('update', () => {
    it('partially updates a <feature> while preserving other fields', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
        {
          name: 'Original',
          description: 'Original desc',
        },
      );

      const result = await service.update(testUserId, created.id, {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
      expect(result.description).toBe('Original desc');
    });

    it('updates description to null', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
        {
          description: 'Has a description',
        },
      );

      const result = await service.update(testUserId, created.id, {
        description: null,
      });

      expect(result.description).toBeNull();
    });

    it('throws NOT_FOUND for a non-existent <feature>', async () => {
      await expect(
        service.update(testUserId, nonExistentId(), { name: 'Nope' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when updating another user <feature>', async () => {
      const otherUserId = await ctx.auth.createUser();
      const other<Feature> = await createTest<Feature>(
        ctx.database,
        otherUserId,
      );

      await expect(
        service.update(testUserId, other<Feature>.id, {
          name: 'Stolen',
        }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });

      await ctx.database
        .delete(<features>)
        .where(eq(<features>.ownerId, otherUserId));
      await ctx.auth.dropUser(otherUserId);
    });
  });

  // ── delete ────────────────────────────────────────────────────────

  describe('delete', () => {
    it('removes the <feature>', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
      );

      await service.delete(testUserId, created.id);

      const result = await service.single(testUserId, created.id);
      expect(result).toBeNull();
    });

    it('throws NOT_FOUND for a non-existent <feature>', async () => {
      await expect(
        service.delete(testUserId, nonExistentId()),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  // ── archive ───────────────────────────────────────────────────────

  describe('archive', () => {
    it('archives an active <feature>', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
        { status: 'active' },
      );

      const result = await service.archive(testUserId, created.id);
      expect(result.status).toBe('archived');
    });

    it('throws CONFLICT when <feature> is already archived', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
        { status: 'archived' },
      );

      await expect(
        service.archive(testUserId, created.id),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('throws NOT_FOUND for a non-existent <feature>', async () => {
      await expect(
        service.archive(testUserId, nonExistentId()),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  // ── restore ───────────────────────────────────────────────────────

  describe('restore', () => {
    it('restores an archived <feature>', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
        { status: 'archived' },
      );

      const result = await service.restore(testUserId, created.id);
      expect(result.status).toBe('active');
    });

    it('throws CONFLICT when <feature> is already active', async () => {
      const created = await createTest<Feature>(
        ctx.database,
        testUserId,
        { status: 'active' },
      );

      await expect(
        service.restore(testUserId, created.id),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('throws NOT_FOUND for a non-existent <feature>', async () => {
      await expect(
        service.restore(testUserId, nonExistentId()),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
```

## Template: Test factory

```typescript
import type { DrizzleDatabase } from '@/infra/drizzle/drizzle.module';
import type { UserId } from '@/infra/auth/auth.schema';
import type { New<Feature>Row } from '@/infra/drizzle/types';
import { <features> } from '@/infra/drizzle/schema';

export async function createTest<Feature>(
  db: DrizzleDatabase,
  ownerId: UserId,
  overrides: Partial<New<Feature>Row> = {},
) {
  const [row] = await db
    .insert(<features>)
    .values({
      ownerId,
      name: 'Test <Feature>',
      status: 'active',
      ...overrides,
    })
    .returning();
  return row;
}
```

## Adapt the templates

- Replace all `<feature>` / `<Feature>` / `<features>` / `<Features>` with actual names.
- Adjust test data values to match the domain entity fields.
- Add/remove test cases based on whether the feature has archive/restore.
- Adjust factory default values to match required columns.

## Verify

Read `.claude/rules/unit-testing.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
````

---

## Task 10: Create scaffold-e2e-test skill

- [ ] Create `.claude/skills/scaffold-e2e-test/SKILL.md`
- [ ] Commit: `feat(skills): add scaffold-e2e-test skill`

### File content: `.claude/skills/scaffold-e2e-test/SKILL.md`

````markdown
---
name: scaffold-e2e-test
description: Create REST and GraphQL end-to-end tests with Testcontainers
---

# scaffold-e2e-test

Creates:
- `test/rest/<features>-rest.e2e-spec.ts`
- `test/graphql/<features>-gql.e2e-spec.ts`

## Inputs

- `feature` — singular lowercase (e.g., `widget`)
- `Feature` — PascalCase (e.g., `Widget`)
- `features` — plural lowercase (e.g., `widgets`)

## Template: REST E2E test

```typescript
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest';
import { eq } from 'drizzle-orm';

import { TestApplicationContext } from '../test-application.context';
import { <features> } from '@/infra/drizzle/schema';
import type { ErrorResponse } from '@/testing/error.response';
import { NON_EXISTENT_UUID } from '@/testing/test-constants';
import { createTest<Feature> } from '@/domain/<feature>/stubs/test-<feature>.factory';
import type { <Feature>Response } from '@/domain/<feature>/rest/responses/<feature>.response';

describe('<Features> REST API', () => {
  let app: TestApplicationContext;
  let testUserId: string;

  beforeAll(async () => {
    app = await TestApplicationContext.create();
    testUserId = await app.auth.defaultUserId();
  }, 120000);

  afterAll(async () => {
    await app.teardown();
  });

  afterEach(async () => {
    await app.database
      .delete(<features>)
      .where(eq(<features>.ownerId, testUserId));
  });

  // ── GET /<features> ────────────────────────────────────────────────

  describe('GET /<features>', () => {
    describe('given no existing <features>', () => {
      it('returns empty array', async () => {
        const client = await app.client();
        const response = await client.get('/api/<features>').expect(200);
        expect(response.body).toEqual([]);
      });
    });

    describe('given existing <features>', () => {
      it('returns all <features> for the user', async () => {
        await createTest<Feature>(app.database, testUserId, {
          name: 'Alpha',
        });
        await createTest<Feature>(app.database, testUserId, {
          name: 'Beta',
        });

        const client = await app.client();
        const response = await client.get('/api/<features>').expect(200);
        expect(response.body).toHaveLength(2);
      });

      it('returns <features> ordered by createdAt desc', async () => {
        await createTest<Feature>(app.database, testUserId, {
          name: 'First',
        });
        await createTest<Feature>(app.database, testUserId, {
          name: 'Second',
        });

        const client = await app.client();
        const response = await client.get('/api/<features>').expect(200);

        const body = response.body as <Feature>Response[];
        expect(body[0].name).toBe('Second');
        expect(body[1].name).toBe('First');
      });
    });
  });

  // ── GET /<features>/:id ────────────────────────────────────────────

  describe('GET /<features>/:id', () => {
    it('returns the <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        name: 'My <Feature>',
      });

      const client = await app.client();
      const response = await client
        .get(`/api/<features>/${row.id}`)
        .expect(200);

      const body = response.body as <Feature>Response;
      expect(body.name).toBe('My <Feature>');
    });

    it('returns 404 for non-existent ID', async () => {
      const client = await app.client();
      const response = await client
        .get(`/api/<features>/${NON_EXISTENT_UUID}`)
        .expect(404);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(404);
    });

    it('returns 400 for invalid UUID', async () => {
      const client = await app.client();
      await client.get('/api/<features>/not-a-uuid').expect(400);
    });
  });

  // ── POST /<features> ───────────────────────────────────────────────

  describe('POST /<features>', () => {
    describe('given a valid request', () => {
      it('creates and returns the <feature> with default status', async () => {
        const client = await app.client();
        const response = await client
          .post('/api/<features>')
          .send({ name: 'New <Feature>' })
          .expect(201);

        const body = response.body as <Feature>Response;
        expect(body.name).toBe('New <Feature>');
        expect(body.status).toBe('active');
        expect(body.id).toBeDefined();
      });

      it('creates a <feature> with all fields', async () => {
        const client = await app.client();
        const response = await client
          .post('/api/<features>')
          .send({
            name: 'Full <Feature>',
            description: 'A description',
            status: 'archived',
          })
          .expect(201);

        const body = response.body as <Feature>Response;
        expect(body.name).toBe('Full <Feature>');
        expect(body.description).toBe('A description');
        expect(body.status).toBe('archived');
      });
    });

    describe('given an invalid request body', () => {
      it('returns 422 for missing required fields', async () => {
        const client = await app.client();
        await client.post('/api/<features>').send({}).expect(422);
      });

      it('returns 422 for empty name', async () => {
        const client = await app.client();
        await client
          .post('/api/<features>')
          .send({ name: '' })
          .expect(422);
      });
    });
  });

  // ── PATCH /<features>/:id ──────────────────────────────────────────

  describe('PATCH /<features>/:id', () => {
    it('updates and returns the <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId);

      const client = await app.client();
      const response = await client
        .patch(`/api/<features>/${row.id}`)
        .send({ name: 'Updated' })
        .expect(200);

      const body = response.body as <Feature>Response;
      expect(body.name).toBe('Updated');
    });

    it('returns 404 for non-existent <feature>', async () => {
      const client = await app.client();
      await client
        .patch(`/api/<features>/${NON_EXISTENT_UUID}`)
        .send({ name: 'X' })
        .expect(404);
    });

    it('returns 400 for invalid UUID', async () => {
      const client = await app.client();
      await client
        .patch('/api/<features>/not-a-uuid')
        .send({ name: 'X' })
        .expect(400);
    });
  });

  // ── DELETE /<features>/:id ─────────────────────────────────────────

  describe('DELETE /<features>/:id', () => {
    it('deletes the <feature> and returns 204', async () => {
      const row = await createTest<Feature>(app.database, testUserId);

      const client = await app.client();
      await client.delete(`/api/<features>/${row.id}`).expect(204);

      // Verify deletion
      await client.get(`/api/<features>/${row.id}`).expect(404);
    });

    it('returns 404 for non-existent <feature>', async () => {
      const client = await app.client();
      await client
        .delete(`/api/<features>/${NON_EXISTENT_UUID}`)
        .expect(404);
    });

    it('returns 400 for invalid UUID', async () => {
      const client = await app.client();
      await client.delete('/api/<features>/not-a-uuid').expect(400);
    });
  });

  // ── POST /<features>/:id/archive ───────────────────────────────────

  describe('POST /<features>/:id/archive', () => {
    it('archives an active <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'active',
      });

      const client = await app.client();
      const response = await client
        .post(`/api/<features>/${row.id}/archive`)
        .expect(201);

      const body = response.body as <Feature>Response;
      expect(body.status).toBe('archived');
    });

    it('returns 409 when <feature> is already archived', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'archived',
      });

      const client = await app.client();
      const response = await client
        .post(`/api/<features>/${row.id}/archive`)
        .expect(409);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(409);
    });

    it('returns 404 for non-existent <feature>', async () => {
      const client = await app.client();
      await client
        .post(`/api/<features>/${NON_EXISTENT_UUID}/archive`)
        .expect(404);
    });
  });

  // ── POST /<features>/:id/restore ───────────────────────────────────

  describe('POST /<features>/:id/restore', () => {
    it('restores an archived <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'archived',
      });

      const client = await app.client();
      const response = await client
        .post(`/api/<features>/${row.id}/restore`)
        .expect(201);

      const body = response.body as <Feature>Response;
      expect(body.status).toBe('active');
    });

    it('returns 409 when <feature> is already active', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'active',
      });

      const client = await app.client();
      const response = await client
        .post(`/api/<features>/${row.id}/restore`)
        .expect(409);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(409);
    });

    it('returns 404 for non-existent <feature>', async () => {
      const client = await app.client();
      await client
        .post(`/api/<features>/${NON_EXISTENT_UUID}/restore`)
        .expect(404);
    });
  });
});
```

## Template: GraphQL E2E test

```typescript
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest';
import { eq } from 'drizzle-orm';

import { TestApplicationContext } from '../test-application.context';
import { <features> } from '@/infra/drizzle/schema';
import { NON_EXISTENT_UUID } from '@/testing/test-constants';
import { createTest<Feature> } from '@/domain/<feature>/stubs/test-<feature>.factory';

describe('<Features> GraphQL API', () => {
  let app: TestApplicationContext;
  let testUserId: string;

  beforeAll(async () => {
    app = await TestApplicationContext.create();
    testUserId = await app.auth.defaultUserId();
  }, 120000);

  afterAll(async () => {
    await app.teardown();
  });

  afterEach(async () => {
    await app.database
      .delete(<features>)
      .where(eq(<features>.ownerId, testUserId));
  });

  // ── Query: <features> ──────────────────────────────────────────────

  describe('Query: <features>', () => {
    it('returns empty array when no <features> exist', async () => {
      const result = await app.executeGraphql<{
        <features>: { id: string; name: string }[];
      }>({
        query: `query { <features> { id name } }`,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.<features>).toEqual([]);
    });

    it('returns all <features> for the user', async () => {
      await createTest<Feature>(app.database, testUserId, {
        name: 'Alpha',
      });
      await createTest<Feature>(app.database, testUserId, {
        name: 'Beta',
      });

      const result = await app.executeGraphql<{
        <features>: { id: string; name: string; status: string }[];
      }>({
        query: `query { <features> { id name status } }`,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.<features>).toHaveLength(2);
    });
  });

  // ── Query: <feature> ───────────────────────────────────────────────

  describe('Query: <feature>', () => {
    it('returns a single <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        name: 'My <Feature>',
      });

      const result = await app.executeGraphql<{
        <feature>: {
          id: string;
          name: string;
          description: string | null;
          status: string;
        };
      }>({
        query: `query <Feature>($id: ID!) { <feature>(id: $id) { id name description status } }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.<feature>.name).toBe('My <Feature>');
      expect(result.data?.<feature>.status).toBe('ACTIVE');
    });

    it('returns error for non-existent ID', async () => {
      const result = await app.executeGraphql<{
        <feature>: { id: string };
      }>({
        query: `query <Feature>($id: ID!) { <feature>(id: $id) { id } }`,
        variables: { id: NON_EXISTENT_UUID },
      });

      expect(result.errors).toBeDefined();
    });
  });

  // ── Mutation: create<Feature> ──────────────────────────────────────

  describe('Mutation: create<Feature>', () => {
    describe('given valid input', () => {
      it('creates and returns the <feature>', async () => {
        const result = await app.executeGraphql<{
          create<Feature>: { id: string; name: string; status: string };
        }>({
          query: `mutation Create<Feature>($input: Create<Feature>Input!) {
            create<Feature>(input: $input) { id name status }
          }`,
          variables: { input: { name: 'New <Feature>' } },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.create<Feature>.name).toBe('New <Feature>');
        expect(result.data?.create<Feature>.status).toBe('ACTIVE');
        expect(result.data?.create<Feature>.id).toBeDefined();
      });

      it('creates a <feature> with description', async () => {
        const result = await app.executeGraphql<{
          create<Feature>: { name: string; description: string };
        }>({
          query: `mutation Create<Feature>($input: Create<Feature>Input!) {
            create<Feature>(input: $input) { name description }
          }`,
          variables: {
            input: { name: '<Feature>', description: 'A description' },
          },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.create<Feature>.description).toBe(
          'A description',
        );
      });
    });

    describe('given invalid input', () => {
      it('returns validation error for empty name', async () => {
        const result = await app.executeGraphql<{
          create<Feature>: { id: string };
        }>({
          query: `mutation Create<Feature>($input: Create<Feature>Input!) {
            create<Feature>(input: $input) { id }
          }`,
          variables: { input: { name: '' } },
        });

        expect(result.errors).toBeDefined();
      });
    });
  });

  // ── Mutation: update<Feature> ──────────────────────────────────────

  describe('Mutation: update<Feature>', () => {
    it('updates and returns the <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        name: 'Original',
      });

      const result = await app.executeGraphql<{
        update<Feature>: { name: string; description: string | null };
      }>({
        query: `mutation Update<Feature>($id: ID!, $input: Update<Feature>Input!) {
          update<Feature>(id: $id, input: $input) { name description }
        }`,
        variables: { id: row.id, input: { name: 'Updated' } },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.update<Feature>.name).toBe('Updated');
    });

    it('returns error for non-existent <feature>', async () => {
      const result = await app.executeGraphql<{
        update<Feature>: { id: string };
      }>({
        query: `mutation Update<Feature>($id: ID!, $input: Update<Feature>Input!) {
          update<Feature>(id: $id, input: $input) { id }
        }`,
        variables: { id: NON_EXISTENT_UUID, input: { name: 'X' } },
      });

      expect(result.errors).toBeDefined();
    });
  });

  // ── Mutation: delete<Feature> ──────────────────────────────────────

  describe('Mutation: delete<Feature>', () => {
    it('deletes the <feature> and returns true', async () => {
      const row = await createTest<Feature>(app.database, testUserId);

      const result = await app.executeGraphql<{
        delete<Feature>: boolean;
      }>({
        query: `mutation Delete<Feature>($id: ID!) { delete<Feature>(id: $id) }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.delete<Feature>).toBe(true);
    });

    it('returns error for non-existent <feature>', async () => {
      const result = await app.executeGraphql<{
        delete<Feature>: boolean;
      }>({
        query: `mutation Delete<Feature>($id: ID!) { delete<Feature>(id: $id) }`,
        variables: { id: NON_EXISTENT_UUID },
      });

      expect(result.errors).toBeDefined();
    });
  });

  // ── Mutation: archive<Feature> ─────────────────────────────────────

  describe('Mutation: archive<Feature>', () => {
    it('archives an active <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'active',
      });

      const result = await app.executeGraphql<{
        archive<Feature>: { id: string; status: string };
      }>({
        query: `mutation Archive<Feature>($id: ID!) {
          archive<Feature>(id: $id) { id status }
        }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.archive<Feature>.status).toBe('ARCHIVED');
    });

    it('returns error when <feature> is already archived', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'archived',
      });

      const result = await app.executeGraphql<{
        archive<Feature>: { id: string };
      }>({
        query: `mutation Archive<Feature>($id: ID!) {
          archive<Feature>(id: $id) { id }
        }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeDefined();
    });

    it('returns error for non-existent <feature>', async () => {
      const result = await app.executeGraphql<{
        archive<Feature>: { id: string };
      }>({
        query: `mutation Archive<Feature>($id: ID!) {
          archive<Feature>(id: $id) { id }
        }`,
        variables: { id: NON_EXISTENT_UUID },
      });

      expect(result.errors).toBeDefined();
    });
  });

  // ── Mutation: restore<Feature> ─────────────────────────────────────

  describe('Mutation: restore<Feature>', () => {
    it('restores an archived <feature>', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'archived',
      });

      const result = await app.executeGraphql<{
        restore<Feature>: { id: string; status: string };
      }>({
        query: `mutation Restore<Feature>($id: ID!) {
          restore<Feature>(id: $id) { id status }
        }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.restore<Feature>.status).toBe('ACTIVE');
    });

    it('returns error when <feature> is already active', async () => {
      const row = await createTest<Feature>(app.database, testUserId, {
        status: 'active',
      });

      const result = await app.executeGraphql<{
        restore<Feature>: { id: string };
      }>({
        query: `mutation Restore<Feature>($id: ID!) {
          restore<Feature>(id: $id) { id }
        }`,
        variables: { id: row.id },
      });

      expect(result.errors).toBeDefined();
    });

    it('returns error for non-existent <feature>', async () => {
      const result = await app.executeGraphql<{
        restore<Feature>: { id: string };
      }>({
        query: `mutation Restore<Feature>($id: ID!) {
          restore<Feature>(id: $id) { id }
        }`,
        variables: { id: NON_EXISTENT_UUID },
      });

      expect(result.errors).toBeDefined();
    });
  });
});
```

## Adapt the templates

- Replace all `<feature>` / `<Feature>` / `<features>` / `<Features>` with actual names.
- Adjust test data values to match the domain entity fields.
- Adjust request bodies for POST/PATCH to match the actual DTO fields.
- If no archive/restore, remove those test sections.
- GraphQL enum values appear as SCREAMING_CASE in responses (e.g., `'ACTIVE'` not `'active'`).

## Verify

Read `.claude/rules/e2e-testing.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
````

---

## Task 11: Create scaffold-feature orchestrator skill

- [ ] Create `.claude/skills/scaffold-feature/SKILL.md`
- [ ] Commit: `feat(skills): add scaffold-feature orchestrator skill`

### File content: `.claude/skills/scaffold-feature/SKILL.md`

````markdown
---
name: scaffold-feature
description: Orchestrate full feature scaffolding by invoking layer-specific skills in sequence
---

# scaffold-feature

Full-stack feature scaffolding orchestrator. Creates all files for a new domain feature by invoking layer skills in the correct order.

## Inputs

Gather from the user:
- `feature` — singular lowercase (e.g., `widget`)
- `Feature` — PascalCase (e.g., `Widget`)
- `features` — plural lowercase (e.g., `widgets`)
- `Features` — PascalCase plural (e.g., `Widgets`)
- `columns` — domain-specific columns beyond the standard set (id, ownerId, timestamps)
- `enumName` — optional status/type enum
- `enumValues` — optional enum values

## Directory structure created

```
src/domain/<feature>/
├── <feature>.model.ts
├── <features>.service.ts
├── <features>.service.spec.ts
├── <features>.module.ts
├── stubs/
│   └── test-<feature>.factory.ts
├── rest/
│   ├── <features>.controller.ts
│   ├── requests/
│   │   ├── create-<feature>.request.ts
│   │   └── update-<feature>.request.ts
│   └── responses/
│       └── <feature>.response.ts
└── graphql/
    ├── <features>.resolver.ts
    ├── <feature>.object.ts
    └── <feature>.input.ts

test/
├── rest/<features>-rest.e2e-spec.ts
├── graphql/<features>-gql.e2e-spec.ts
```

## Execution order

Run these skills in sequence. Each skill creates its files and runs its own verify step.

1. **`/scaffold-database`** — Add pgEnum, pgTable to schema.ts, row types to types.ts
2. Run `pnpm db:generate && pnpm db:migrate` to create and apply migration
3. **`/scaffold-model`** — Create `<feature>.model.ts` with domain class, ID type, enum, Create/Update types
4. **`/scaffold-service`** — Create `<features>.service.ts` with all CRUD methods
5. **Wire the module** — Create `<features>.module.ts`:
   ```typescript
   import { Module } from '@nestjs/common';
   import { <Features>Service } from './<features>.service';
   import { <Features>Controller } from './rest/<features>.controller';
   import { <Features>Resolver } from './graphql/<features>.resolver';

   @Module({
     providers: [<Features>Service, <Features>Resolver],
     controllers: [<Features>Controller],
     exports: [<Features>Service],
   })
   export class <Features>Module {}
   ```
6. **Register in FeaturesModule** — Add import to `src/domain/features.module.ts`
7. **`/scaffold-rest`** — Create controller, request DTOs, response DTO
8. **`/scaffold-graphql`** — Create resolver, object type, input types
9. **`/scaffold-unit-test`** — Create service spec + test factory
10. **`/scaffold-e2e-test`** — Create REST + GraphQL E2E tests

## Post-scaffolding

After all files are created:
1. Run `pnpm lint` to fix formatting
2. Run `pnpm test <features>.service` to verify unit tests pass
3. Run `pnpm test:e2e <features>` to verify E2E tests pass
4. Commit all files with message: `feat(<features>): scaffold <feature> feature`
````

---

## Task 12: Create review-conventions skill

- [ ] Create `.claude/skills/review-conventions/SKILL.md`
- [ ] Commit: `feat(skills): add review-conventions audit skill`

### File content: `.claude/skills/review-conventions/SKILL.md`

````markdown
---
name: review-conventions
description: Audit domain feature code against convention rules, reporting violations with file:line references
---

# review-conventions

Audits existing feature code against the project's convention rules. Reports every `!IMPORTANT` and `NEVER` violation with `file:line` references.

## Inputs

- `feature` — (optional) feature name to audit (e.g., `widgets`). If omitted, audits all files in `git diff --name-only`.

## Rule-to-path mapping

| Rule file | Applies to paths |
|---|---|
| `.claude/rules/model.md` | `src/domain/**/*.model.ts` |
| `.claude/rules/service.md` | `src/domain/**/*.service.ts` |
| `.claude/rules/rest.md` | `src/domain/**/rest/**` |
| `.claude/rules/graphql.md` | `src/domain/**/graphql/**` |
| `.claude/rules/database.md` | `src/infra/drizzle/**` |
| `.claude/rules/unit-testing.md` | `src/**/*.spec.ts` |
| `.claude/rules/e2e-testing.md` | `test/**/*.e2e-spec.ts` |
| `.claude/rules/architecture.md` | `src/domain/**/*` |
| `.claude/rules/code-style.md` | `src/**/*.ts`, `test/**/*.ts` |

## Procedure

1. **Identify files to audit:**
   - If `feature` is provided: find all files under `src/domain/<feature>/` and matching test files
   - If not provided: run `git diff --name-only HEAD~1` to get recently changed files

2. **For each file:**
   - Match the file path against the rule-to-path mapping above
   - Read the matching rule file(s) — a file can match multiple rules
   - Extract every line containing `!IMPORTANT` or `NEVER`
   - Read the source file
   - Check each constraint against the actual code

3. **Report findings:**
   - For each violation, report: `VIOLATION: <rule-file> — "<constraint text>" — <source-file>:<line>`
   - For each pass, report: `PASS: <rule-file> — "<constraint text>"`
   - Summary at the end: `X violations found, Y constraints checked`

## Example output

```
Checking src/domain/widgets/widgets.service.ts against service.md...
  PASS: service.md — "Use these exact method names: all, single, exists, create, update, delete, archive, restore"
  PASS: service.md — "Every query MUST filter by ownerId"
  VIOLATION: service.md — "NEVER spread the entire update object into .set()" — widgets.service.ts:42

Checking src/domain/widgets/rest/widgets.controller.ts against rest.md...
  PASS: rest.md — "Create and Update request DTOs are always separate classes"
  PASS: rest.md — "@ApiSchema({ name }) on every request and response DTO"

Summary: 1 violation found, 6 constraints checked
```

## Notes

- This skill reads rules (max ~50 lines each) and source files — total context cost is minimal.
- Focus on mechanical checks: presence of decorators, import paths, method names, anti-pattern code smells.
- For subjective constraints (e.g., "JSDoc on every property"), check for presence, not quality.
````

---

## Task 13: Eval -- scaffold a feature using the new skills+rules

- [ ] Dispatch a worktree agent to scaffold a "notes" feature using the new skills
- [ ] Agent invokes `/scaffold-feature` with: feature=note, Feature=Note, features=notes, Features=Notes
- [ ] Agent follows the orchestrator sequence through all layer skills
- [ ] After scaffolding, agent runs `/review-conventions notes` to audit the output
- [ ] Fix any violations found during the review
- [ ] Run `pnpm test notes.service` to verify unit tests pass
- [ ] Run `pnpm test:e2e notes` to verify E2E tests pass
- [ ] If issues are found, update the relevant skill/rule and re-run
- [ ] Commit: `test(eval): scaffold notes feature to validate skills+rules`
- [ ] Clean up: delete the notes feature (it was only for eval)
- [ ] Commit: `chore: remove eval notes feature`
