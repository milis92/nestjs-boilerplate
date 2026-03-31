---
paths:
  - "src/domain/**/rest/**"
---

# REST Controller Layer

> Controllers delegate to services and transform between HTTP DTOs and domain types.

## Controller Conventions

Class-level decorators in this order:

```typescript
@Controller('widgets')
@UseFilters(ServiceErrorFilter)
@OpenApiController('Widgets')
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}
}
```

- `@Controller('<plural-name>')` — route path is plural, lowercase (e.g., `widgets`, `category-groups`)
- `@UseFilters(ServiceErrorFilter)` from `@/domain/shared/errors/error.filter`
- `@OpenApiController(tag)` from `@/tools/openapi/openapi-controller.decorator`

## Endpoint Decorators

- `@CurrentUser() user: AuthUser` — from `@/infra/auth/auth.decorators`
- `@UUIDv7Param('id')` — from `@/domain/shared/decorators/UUIDv7-param.decorator` for path params
- `@OpenApiEndpoint(config)` — from `@/tools/openapi/openapi-endpoint.decorator`

## Request DTOs

- !IMPORTANT: Create and Update request DTOs are always separate classes (NEVER use `PartialType`).
- !IMPORTANT: Every request class MUST have a `toDomain()` method converting to `CreateFoo` / `UpdateFoo`.
- !IMPORTANT: `@ApiSchema({ name })` on every request and response DTO for OpenAPI schema naming.

```typescript
toDomain(): CreateWidget {
  return {
    name: this.name,
    description: this.description ?? null,
    status: this.status ?? 'active',
  };
}
```

## Response DTOs

- `static fromDomain(entity)` factory constructs the response — assigns fields directly.
- `static fromDomainList(entities)` for list endpoints — delegates to `fromDomain()` via `.map()`.

## Not-Found Handling

When `service.single()` returns null, throw `NotFoundException` in the controller:

```typescript
const widget = await this.widgetsService.single(user.id, id);
if (!widget) throw new NotFoundException(`Widget with id '${id}' not found`);
return WidgetResponse.fromDomain(widget);
```

## Anti-patterns

- NEVER access the database from controllers — delegate all data access to the service layer.
- NEVER manually validate UUID path params — use `@UUIDv7Param()`.
- NEVER return 400 for validation errors — the global `ValidationPipe` returns 422.
- NEVER construct response objects with `new` and setters — use the static `fromDomain()` factory.

## Full Example

For complete working implementations, see:
- `.claude/rules/rest/examples/widgets.controller.ts`
- `.claude/rules/rest/examples/create-widget.request.ts`
- `.claude/rules/rest/examples/update-widget.request.ts`
- `.claude/rules/rest/examples/widget.response.ts`
