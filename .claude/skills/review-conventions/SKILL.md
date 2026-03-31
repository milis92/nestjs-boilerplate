---
name: review-conventions
description: Audit domain feature code against convention rules, reporting violations with file:line references
---

# review-conventions

Audits existing feature code against the project's convention rules. Reports every `!IMPORTANT` and `NEVER` violation with `file:line` references.

## Inputs

- `feature` — (optional) feature name to audit (e.g., `widgets`). If omitted, audits all files in `git diff --name-only`.

## Rule-to-path mapping

| Rule file                                    | Applies to paths              |
|----------------------------------------------|-------------------------------|
| `.claude/rules/model/model.md`               | `src/domain/**/*.model.ts`    |
| `.claude/rules/service/service.md`           | `src/domain/**/*.service.ts`  |
| `.claude/rules/rest/rest.md`                 | `src/domain/**/rest/**`       |
| `.claude/rules/graphql/graphql.md`           | `src/domain/**/graphql/**`    |
| `.claude/rules/database/database.md`         | `src/infra/drizzle/**`        |
| `.claude/rules/unit-testing/unit-testing.md` | `src/**/*.spec.ts`            |
| `.claude/rules/e2e-testing/e2e-testing.md`   | `test/**/*.e2e-spec.ts`       |
| `.claude/rules/architecture.md`              | `src/domain/**/*`             |
| `.claude/rules/code-style.md`                | `src/**/*.ts`, `test/**/*.ts` |

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
