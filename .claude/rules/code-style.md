# Code Style

Universal TypeScript formatting, import organization, and comment conventions.

## Formatting

- 2-space indentation (configured via Prettier)
- Single quotes for strings
- Trailing commas in multiline constructs
- Explicit return types on all public methods
- Use definite assignment (`!`) for required class properties set in constructor
- Use property defaults for optional fields with known defaults

## Import organization

Group imports in this order with blank lines between groups:

1. External packages (`@nestjs/*`, `drizzle-orm`, `class-validator`)
2. Domain imports (`@/domain/...`)
3. Infrastructure imports (`@/infra/...`)
4. OpenAPI imports (`@/openapi/...`)
5. Relative imports (`./`, `../`)

Use the `@/` path alias for absolute imports from `src/`.

## Comments

- Use JSDoc (`/** */`) on domain model classes, their properties, and public service methods.
- Use inline comments only when the logic is non-obvious — explain why, not what.
- Do not add file-level `@fileoverview` JSDoc to every file; reserve for complex utility modules.

## Anti-patterns

- Do not use `require()` — use ES module `import` syntax.
- Do not use `// @ts-ignore` or `// @ts-expect-error` to suppress type errors — fix the types.
- Prefer named exports over default exports.
