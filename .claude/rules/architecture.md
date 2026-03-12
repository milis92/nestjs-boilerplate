---
paths:
  - "src/domain/**/*"
---

# Domain Module Architecture

Every domain feature lives under `src/domain/<feature>/` and follows a strict structure. DO NOT DEVIATE.

## Mandatory Directory structure

```
src/domain/<feature>/
├── <feature>.module.ts           # NestJS module — wires DI
├── <feature>.service.ts          # Domain logic, models, types (single file)
├── <feature>.service.spec.ts     # Unit tests for the service
├── stubs/
│   └── test-<feature>.factory.ts # Test data factory for this feature
├── rest/
│   ├── <feature>.controller.ts       # HTTP endpoints
│   ├── requests/                     # One file per request DTO
│   │   ├── create-<feature>.request.ts
│   │   └── update-<feature>.request.ts
│   └── responses/                   # One file per response DTO
│       └── <feature>.response.ts
└── graphql/
    ├── <feature>.resolver.ts     # GraphQL queries + mutations
    ├── <feature>.object.ts       # @ObjectType + enum registrations
    └── <feature>.input.ts        # @InputType for create/update
```

## Feature NestJs Module

- File: `<feature>.module.ts`
- Class: `<Features>Module` (plural + "Module")

## Module wiring

Key points:

- Services inject the global `DrizzleDatabase` via `@InjectDrizzle()`
- The service is always exported, so other modules can depend on it.

### Cross-module dependencies

- One domain module CAN depend on another domain module by importing its NestJS module and injecting its exported service.
- Infrastructure modules (`src/infra/`) provide cross-cutting concerns. 
- Domain modules import from infra via `@/infra/...`.
- Infra modules never import from domain.

## Layering rules

- **Service** is the single source of truth for business logic.
- **Controllers and Resolvers** delegate to the service and transform results.
- **Request classes** own input validation (class-validator) and provide a `toDomain()` method to convert to service input.
- **Response classes** and **ObjectTypes** provide a `static fromDomain()` factory to convert from service output.
- Controllers and resolvers never access the database directly.

## Shared utilities

Cross-domain code lives in `src/domain/shared/`:

- `errors/service.error.ts` — `ServiceError` class with typed error codes
- `errors/error.filter.ts` — `ServiceErrorFilter` exception filter
- `helpers/omit-undefined.ts` — strips undefined keys from update objects
- `helpers/enum-object.ts` — `createEnumObject()` for string literal enums
- `decorators/UUIDv7-param.decorator.ts` — `@UUIDv7Param()` validation pipe for id params

## Anti-patterns

- Do not access the database from controllers or resolvers.
- Do not create circular module dependencies.
