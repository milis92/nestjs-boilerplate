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
| Archive   | `@Post(':id/archive')`              | 201    | `FooResponse`   |
| Restore   | `@Post(':id/restore')`              | 201    | `FooResponse`   |

## Request types

Request DTOs are responsible for validation and conversion to the service layer type.

- Create and Update request DTOs are always **separate classes** (not using `PartialType`).
- `@ApiSchema({ name })` for OpenAPI schema naming (not the class name).
- Every request class has a `toDomain()` method that converts the HTTP-facing DTO into the service-layer type.

### Validation rules

| Pattern                    | Decorator stack                                          | DTO type                   | Example                    |
|----------------------------|----------------------------------------------------------|----------------------------|----------------------------|
| Required                   | `@IsString() @Length(1,255)`                             | `name!: string`            | Names, IDs                 |
| Optional (omittable)       | `@IsOptional() @IsString()`                              | `name?: string`            | Optional references        |
| Nullable (explicitly null) | `@ValidateIf((o) => o.field !== null)` + `@IsOptional()` | `notes?: string \| null`   | Notes, descriptions        |
| Default value              | `@IsOptional() @IsString()`                              | `currency: string = 'USD'` | Flags, enums with defaults |

### Service-layer conversion rules

- **Direct passthrough** — `name: this.name`
- **Type conversion** — `amount: BigInt(this.amount)`, `date: new Date(this.date)`
- **Nullish coalescing for defaults** — `type: this.type ?? 'standard'`
- **Nullable fallback** — `notes: this.notes ?? null`
- **Field renaming** — `foo: this.fooId` (DTO name differs from domain name)
- **Nested mapping** — `splits: this.splits.map((s) => s.toDomain())`

## Response types

Response DTO's responsible for mapping from the service layer type to the HTTP-facing type.

- `@ApiSchema({ name })` for OpenAPI schema naming.
- `static fromDomain(foo: Foo)` factory constructs the response — assigns fields directly, no constructor args.
- `static fromDomainList(foos: Foo[])` for list endpoints — delegates to `fromDomain()` via `.map()`.

### Field mapping in `fromDomain()`

- **Direct passthrough** — `response.name = entity.name`
- **Nested single** — `response.foo = entity.foo ? FooResponse.fromDomain(entity.foo) : null`
- **Nested array** — `response.bars = entity.bars ? BarResponse.fromDomainList(entity.bars) : []`

## OpenAPI decorators

- `@OpenApiController(tag)` — class-level: tags, bearer betterAuth, common errors.
- `@OpenApiEndpoint(config)` — method-level: summary, response type, params, errors.

## Anti-patterns

- NEVER access the database from controllers — delegate all data access to the service layer.
- NEVER throw `ServiceError` from controllers — let `ServiceErrorFilter` handle errors originating from services.
- NEVER manually validate UUID path params — use `@UUIDv7Param()`.
- NEVER return 400 for validation errors — the global `ValidationPipe` returns 422.
- NEVER construct response objects with `new` and setters** — use the static `fromDomain()` factory.
