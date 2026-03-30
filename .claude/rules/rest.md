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
