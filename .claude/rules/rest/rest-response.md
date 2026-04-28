---
paths:
    - "src/domain/**/rest/responses/*.ts"
---

## Naming

Response classes are named `<Resource>Response` — never "DTO".

## @ApiSchema

Decorate every response class with `@ApiSchema`. The `name` must be the concrete type name **without** the `Response` suffix:

```typescript
// ✅
@ApiSchema({ name: 'Widget', description: '...' })
export class WidgetResponse { ... }

// ❌ — suffix included
@ApiSchema({ name: 'WidgetResponse' })
```

## `fromDomain`

Expose a `static fromDomain(entity: Model): <Resource>Response` factory. Assign every field individually on a new instance — no `Object.assign`, no spread:

```typescript
static fromDomain(entity: Widget): WidgetResponse {
  const response = new WidgetResponse();
  response.id = entity.id;
  response.name = entity.name;
  // ...
  return response;
}
```

Also define `fromDomainList` for array responses:

```typescript
static fromDomainList(entities: Widget[]): WidgetResponse[] {
  return entities.map((e) => WidgetResponse.fromDomain(e));
}
```

## Anti-patterns

- NEVER name a class `XxxDto` — use `<Resource>Response`.
- NEVER use `Object.assign` or object spread (`{ ...entity }`) in `fromDomain`.
- NEVER include `Response` in the `@ApiSchema` `name`.

## Example

@.claude/rules/rest/examples/widget.response.ts
