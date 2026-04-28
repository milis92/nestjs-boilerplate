---
paths:
    - "src/**/*.ts"
    - "test/**/*.ts"
---

## Type discipline

- Never use `any`. Use `unknown` at external boundaries (parsed JSON, third-party callbacks) and narrow with type guards.
- No type assertions (`as X`) except when receiving data from external APIs where the shape is verified out-of-band. Leave a comment explaining why.
- Use `type` for union and mapped types; use `interface` for object shapes that may be extended. No `I` prefix on interfaces.

## Import style

Apply the `type` keyword to every type-only import. Use inline `type` when the same module exports both values and types; use a standalone `import type` when importing types only:

## Error handling

- Throw `ServiceError` (from `@/domain/shared/errors/service.error`) from service methods — never throw plain strings, bare objects, or generic `Error` instances.
- Never swallow errors silently. Catch blocks must either handle the error, rethrow it, or convert it to a typed error.
- Use `this.logger.error('message', error)` — never `console.log` or `console.error`. Pass the error as the second argument so the stack trace is preserved.

## Comments

Every exported symbol (class, function, type, interface, constant) must have a `/** */` JSDoc block. The block should cover:
- **What it does** at a high level — one sentence is usually enough.
- **How it works** when the mechanism is not obvious from the name and types alone.
- **Why** a non-obvious design decision was made.

Omit `@param` / `@returns` tags unless the semantics are genuinely surprising. Do not restate what the name or signature already says.

Use `//` inline only when the logic is non-obvious — explain **why**, not **what**.

## Naming conventions

| Thing                                   | Convention              | Example                     |
|-----------------------------------------|-------------------------|-----------------------------|
| Class, interface, type, enum            | PascalCase              | `UserService`, `AuthToken`  |
| Variable, function, method, parameter   | camelCase               | `findById`, `accessToken`   |
| Module-level constant (truly invariant) | SCREAMING_SNAKE         | `MAX_RETRY_COUNT`           |
| File                                    | kebab-case              | `user-created.hook.ts`      |
| Boolean variable or method              | `is`/`has`/`can` prefix | `isActive`, `hasPermission` |

## Anti-patterns

- NEVER use `// @ts-ignore` or `// @ts-expect-error` — fix the types instead.
- NEVER use `require()` — use ES module `import` syntax.
- Prefer named exports over default exports.
