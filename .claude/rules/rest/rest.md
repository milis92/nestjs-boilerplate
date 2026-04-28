---
paths:
    - "src/domain/**/rest/**/*.controller.ts"
---

## Class-level decorator stack

Every domain controller uses exactly these three decorators, in this order:

```typescript
@Controller('resource')
@OpenApiController('Tag')
@UseFilters(ServiceErrorFilter)
```

- `@OpenApiController(tag)` — groups endpoints in Swagger UI and adds `ApiBearerAuth()`, `401`, and `500` responses
  automatically. Import from `@/tools/openapi/openapi-controller.decorator`.
- `@UseFilters(ServiceErrorFilter)` — translates `ServiceError` from the service layer into HTTP responses. Import from
  `@/domain/shared/errors/error.filter`.

## Controller methods

- Inject the authenticated user with `@CurrentUser() user: AuthUser`. Always pass `user.id` to service calls.
- Use `@UUIDv7Param('param')` for every UUIDv7 path parameter. It automatically returns `400 Bad Request` when the value
  is not a valid UUIDv7.

## @OpenApiEndpoint

!IMPORTANT: Every method requires `@OpenApiEndpoint()`. Declare an `errors` array matching what the endpoint can
actually return.

**Error code rules:**

| Situation                                              | Status                       |
|--------------------------------------------------------|------------------------------|
| Invalid UUIDv7 path param                              | `BAD_REQUEST (400)`          |
| Resource not found (when `single()` can return `null`) | `NOT_FOUND (404)`            |
| Body or query-param validation failed                  | `UNPROCESSABLE_ENTITY (422)` |

Non-default success status (201, 204) must be declared in **both** `@HttpCode` and the `status` field of
`@OpenApiEndpoint`. Use `params` to document each `@UUIDv7Param`.

## Input/output transformation

- Call `request.toDomain()` — never pass the raw request object to the service.
- Call `XxxResponse.fromDomain(result)` or `XxxResponse.fromDomainList(results)` — never construct response objects
  manually.
- Throw `NotFoundException` inline when `single()` returns `null` — that is the only business decision controllers make.

## Anti-patterns

- NEVER put business logic in a controller.
- NEVER use `@Param()` for UUIDv7 params — use `@UUIDv7Param()`.
- NEVER add raw `@ApiTags`, `@ApiBearerAuth`, or `@ApiResponse` for 401/500 to a controller using `@OpenApiController`.
- NEVER omit `errors` from `@OpenApiEndpoint` on endpoints with path params or body/query validation.

## Full example

@.claude/rules/rest/examples/widgets.controller.ts
