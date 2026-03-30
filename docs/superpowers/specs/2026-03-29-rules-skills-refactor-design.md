# Rules + Skills Refactoring Design

**Goal:** Replace the monolithic scaffold-feature skill (1425 lines) with matched rule/skill pairs per domain layer, extract domain models to their own file, and add built-in verification.

## Principles

1. **Rules** are passive constraints — auto-loaded by `paths:`, ~40-50 lines, contain `!IMPORTANT` and `NEVER` markers. No code templates.
2. **Skills** are active recipes — invoked on demand, ~100-200 lines, contain inline code templates. Each skill reads its matching rule to verify compliance after creating files.
3. **One source of truth** — the rule defines the constraint, the skill references the rule for verification. No duplication.
4. **Domain models** live in their own file (`<feature>.model.ts`, singular) with their own rule/skill pair.

## File Structure

### Rules (`.claude/rules/`)

| File | Paths | Content |
|---|---|---|
| `model.md` | `src/domain/**/*.model.ts` | Constructor mapping, fromRowset, ID types, Create/Update types, JSDoc, updatedAt nullability |
| `service.md` | `src/domain/**/*.service.ts` | Injection, method naming, ownership scoping, error handling table, anti-patterns |
| `rest.md` | `src/domain/**/rest/**` | Controller decorators + import paths, separate DTOs, toDomain, ApiSchema, anti-patterns |
| `graphql.md` | `src/domain/**/graphql/**` | Naming table, PartialType for updates, enum registration, UseFilters, anti-patterns |
| `database.md` | `src/infra/drizzle/**` | Directory structure, naming conventions table, shared helpers, anti-patterns |
| `unit-testing.md` | `src/**/*.spec.ts` | What-to-test, setup rules, utilities API, factory conventions, anti-patterns |
| `e2e-testing.md` | `test/**/*.e2e-spec.ts` | Directory structure, setup timing, what-to-test, utilities API, anti-patterns |
| `architecture.md` | `src/domain/**/*` | Module naming, cross-module deps, layering rules, shared utilities, file naming (singular/plural) |
| `code-style.md` | `src/**/*.ts`, `test/**/*.ts` | Formatting, imports, comments — unchanged |

### Skills (`.claude/skills/`)

| Skill | Lines (target) | Content |
|---|---|---|
| `scaffold-model/SKILL.md` | ~100 | Domain model class template, ID type, enum via createEnumObject, Create/Update types, verify |
| `scaffold-service/SKILL.md` | ~150 | Service class template with all CRUD methods, error handling, verify |
| `scaffold-rest/SKILL.md` | ~200 | Controller, create/update request DTOs, response DTO, OpenAPI decorators, verify |
| `scaffold-graphql/SKILL.md` | ~200 | Object type with enum, input types (PartialType), resolver with all mutations, verify |
| `scaffold-database/SKILL.md` | ~100 | Schema additions (pgEnum, pgTable), relations, row types, verify |
| `scaffold-unit-test/SKILL.md` | ~150 | Test setup, factory function, test cases per method, verify |
| `scaffold-e2e-test/SKILL.md` | ~150 | REST + GraphQL E2E test templates, verify |
| `scaffold-feature/SKILL.md` | ~80 | Orchestrator — directory structure, file creation order, invokes layer skills in sequence |
| `review-conventions/SKILL.md` | ~80 | Full audit — reads rules, checks all constraints, reports violations with file:line |

### Domain Module Structure (updated)

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

File naming: singular for model + GraphQL types (`widget.model.ts`, `widget.object.ts`), plural for service/controller/resolver (`widgets.service.ts`, `widgets.controller.ts`, `widgets.resolver.ts`).

## Skill Verify Pattern

Every scaffold skill ends with:

```markdown
## Verify

Read `.claude/rules/<matching-rule>.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
```

This costs zero extra tokens — the agent already has the file in context. It just re-reads the rule (which is ~40-50 lines) and checks.

## `/review-conventions` Skill

For auditing existing features or PRs:
1. Takes a feature name or defaults to files in `git diff`
2. For each file, identifies the matching rule via path patterns
3. Reads the rule, checks every `!IMPORTANT` and `NEVER` constraint
4. Reports violations with `file:line` references

## Cleanup

- Delete current `.claude/skills/scaffold-feature/SKILL.md` (1425-line monolith)
- Delete `src/domain/widgets/` (test feature)
- Delete widgets migration from `.database/`
- Delete `docs/superpowers/plans/2026-03-28-widgets.md` and `docs/superpowers/specs/2026-03-28-widgets-design.md`
- Restore rules to proper richness with improvements from this session (no duplication between rules, `!IMPORTANT` markers, explicit import paths, `@file/path` references)

## What Does NOT Change

- `architecture.md` — no matching skill (cross-cutting constraints)
- `code-style.md` — no matching skill (formatting/imports)
- CLAUDE.md — unchanged
- Infrastructure code — unchanged
- Test infrastructure — unchanged
