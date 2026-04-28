---
paths:
    - "src/domain/**/rest/requests/*.ts"
---

## Naming

Input classes are named `<Action><Resource>Request` — never "DTO".

## @ApiSchema

Decorate every request class with `@ApiSchema`. The `name` must be the concrete type name **without** the `Request` suffix:

```typescript
// ✅
@ApiSchema({ name: 'CreateWidget', description: '...' })
export class CreateWidgetRequest { ... }

// ❌ — suffix included
@ApiSchema({ name: 'CreateWidgetRequest' })
```

## `toDomain`

Expose an instance method `toDomain(): <DomainModel>` returning a plain object literal. Map every field individually — no `Object.assign`, no spread:

```typescript
toDomain(): CreateWidget {
  return {
    name: this.name,
    description: this.description ?? null,
    priority: this.priority ?? 0,
  };
}
```

## Anti-patterns

- NEVER name a class `XxxDto` — use `<Action><Resource>Request`.
- NEVER use `Object.assign` or object spread (`{ ...this }`) in `toDomain`.
- NEVER include `Request` suffix in the `@ApiSchema` `name`.

## Examples

@.claude/rules/rest/examples/create-widget.request.ts
@.claude/rules/rest/examples/update-widget.request.ts
