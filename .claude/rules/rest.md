---
paths:
  - "src/domain/**/rest/**"
---

# REST Controller Layer

Rules for writing REST controllers, request/response DTOs, and OpenAPI decorators.

## Mandatory Directory structure

```
src/domain/<feature>/rest/
├── <feature>.controller.ts       # HTTP endpoints
├── requests/                     # One file per request DTO
│   ├── create-<feature>.request.ts
│   └── update-<feature>.request.ts
└── responses/
    └── <feature>.response.ts
```

## Controller conventions

Key class-level decorators:

- `@Controller('<plural-name>')` — route path is plural, lowercase (e.g., `widgets`, `category-groups`)
- `@OpenApiController(tag)` - Applies common OpenAPI decorators
- `@UseFilters(ServiceErrorFilter)` — maps `ServiceError` codes to HTTP status codes

### Controller method parameters

- `@CurrentUser() user: AuthUser` for the authenticated user.
- `@UUIDv7Param('id')` for path parameters — validates UUID v7 format, returns 400 on invalid input.
- `@Body() request: CreateFooRequest` for request bodies.

### Controller method body

Pattern: delegate to service, transform result, return.

```typescript
// Create
const foo = await this.foosService.create(user.id, request.toDomain());
return FooResponse.fromDomain(foo);

// List
const foos = await this.foosService.all(user.id);
return FooResponse.fromDomainList(foos);

// Get one (service returns null when not found)
const bar = await this.foosService.single(user.id, id);
if (!bar) throw new NotFoundException(`Foo with id '${id}' not found`);
return FooResponse.fromDomain(bar);
```

### Controller method return types

| Operation | Decorator                           | Status | Returns         |
|-----------|-------------------------------------|--------|-----------------|
| List all  | `@Get()`                            | 200    | `FooResponse[]` |
| Get one   | `@Get(':id')`                       | 200    | `FooResponse`   |
| Create    | `@Post()` + `@HttpCode(201)`        | 201    | `FooResponse`   |
| Update    | `@Patch(':id')`                     | 200    | `FooResponse`   |
| Delete    | `@Delete(':id')` + `@HttpCode(204)` | 204    | `void`          |
| Archive   | `@Post(':id/archive')`              | 200    | `FooResponse`   |
| Restore   | `@Post(':id/restore')`              | 200    | `FooResponse`   |

## Request types

Request DTO's responsible for validation and conversion to the service layer type.

- `@ApiSchema({ name })` for OpenAPI schema naming (not the class name).
- Every request class has a `toDomain()` method that converts the HTTP-facing DTO into the service-layer type.

### Validation

Global `ValidationPipe` is configured with:

- `whitelist: true` — strips unknown properties
- `forbidNonWhitelisted: true` — errors on unknown properties
- `transform: true` — auto-transforms plain objects to DTO instances
- `errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY` — returns 422, not 400

#### Validation rules

| Pattern                    | Decorator stack                                          | DTO type                   | Example                    |
|----------------------------|----------------------------------------------------------|----------------------------|----------------------------|
| Required                   | `@IsString() @Length(1,255)`                             | `name!: string`            | Names, IDs                 |
| Optional (omittable)       | `@IsOptional() @IsString()`                              | `name?: string`            | Optional references        |
| Nullable (explicitly null) | `@ValidateIf((o) => o.field !== null)` + `@IsOptional()` | `notes?: string \| null`   | Notes, descriptions        |
| Default value              | `@IsOptional() @IsString()`                              | `currency: string = 'USD'` | Flags, enums with defaults |

### Service-layer conversion

- **Direct passthrough** — `name: this.name`
- **Type conversion** — `amount: BigInt(this.amount)`, `date: new Date(this.date)`
- **Nullish coalescing for defaults** — `categorySource: this.categorySource ?? 'manual'`
- **Nullable fallback** — `notes: this.notes ?? null`
- **Field renaming** — `category: this.categoryId` (DTO name differs from domain name)
- **Nested mapping** — `splits: this.splits.map((s) => s.toDomain())`

**Create vs Update `toDomain()` differences:**

```typescript
// Create — required fields, direct conversion, defaults via ??
function toDomain(): CreateFoo {
    return {
        amount: BigInt(this.amount),
        notes: this.notes ?? null,
    };
}

// Update — all optional, guard conversions with undefined check
function toDomain(): UpdateFoo {
    return {
        amount: this.amount !== undefined ? BigInt(this.amount) : undefined,
        notes: this.notes,
    };
}
```

## Response types

Response DTO's responsible for mapping from the service layer type to the HTTP-facing type.

- `@ApiSchema({ name })` for OpenAPI schema naming.
- `static fromDomain(foo: Foo)` factory constructs the response — assigns fields directly, no constructor args.
- `static fromDomainList(foos: Foo[])` for list endpoints — delegates to `fromDomain()` via `.map()`.

### Field mapping in `fromDomain()`

- **Direct passthrough** — `response.name = entity.name`
- **Nested single** — `response.category = entity.category ? CategoryResponse.fromDomain(entity.category) : null`
- **Nested array** — `response.tags = entity.tags ? TagResponse.fromDomainList(entity.tags) : []`

## OpenAPI decorators

- `@OpenApiController(tag)` — class-level: tags, bearer betterAuth, common errors.
- `@OpenApiEndpoint(config)` — method-level: summary, response type, params, errors.

## Anti-patterns

- **Do not access the database from controllers** — delegate all data access to the service layer.
- **Do not throw `ServiceError` from controllers** — throw `NotFoundException` for not-found cases; let
  `ServiceErrorFilter` handle errors originating from services.
- **Do not manually validate UUID path params** — use `@UUIDv7Param()`.
- **Do not return 400 for validation errors** — the global `ValidationPipe` returns 422.
- **Do not construct response objects with `new` and setters** — use the static `fromDomain()` factory.
