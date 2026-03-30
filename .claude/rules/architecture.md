---
paths:
  - "src/domain/**/*"
---

# Domain Module Architecture

> Cross-cutting constraints for the domain layer. Individual layer rules: `model.md`, `service.md`, `rest.md`, `graphql.md`. The `/scaffold-feature` orchestrator skill provides full scaffolding.

## Directory structure

```
src/domain/<feature>/
├── <feature>.model.ts            # Domain model, ID type, enum, Create/Update types
├── <feature>.service.ts          # Service class (imports from model)
├── <feature>.service.spec.ts     # Unit tests
├── <feature>.module.ts           # NestJS module
├── stubs/
│   └── test-<feature>.factory.ts
├── rest/
│   ├── <feature>.controller.ts
│   ├── requests/
│   │   ├── create-<feature>.request.ts
│   │   └── update-<feature>.request.ts
│   └── responses/
│       └── <feature>.response.ts
└── graphql/
    ├── <feature>.resolver.ts
    ├── <feature>.object.ts
    └── <feature>.input.ts
```

## Naming

- Module class: `<Features>Module` (plural + "Module"), e.g. `WidgetsModule`
- !IMPORTANT: File names use the **singular** feature name for model + GraphQL types (`widget.model.ts`, `widget.object.ts`, `widget.input.ts`), **plural** for service/controller/resolver (`widgets.service.ts`, `widgets.controller.ts`, `widgets.resolver.ts`).

## Cross-module dependencies

- One domain module CAN depend on another by importing its NestJS module and injecting its exported service.
- Infrastructure modules (`src/infra/`) provide cross-cutting concerns.
- Domain modules import from infra via `@/infra/...`.
- !IMPORTANT: Infra modules NEVER import from domain.

## Layering rules

- **Model** is the single source of truth for the domain entity, ID type, and Create/Update types.
- **Service** is the single source of truth for business logic. Imports domain types from the model file.
- **Controllers and Resolvers** delegate to the service and transform results.
- **Request classes** own input validation (class-validator) and provide a `toDomain()` method.
- **Response classes** and **ObjectTypes** provide a `static fromDomain()` factory.
- !IMPORTANT: Controllers and resolvers NEVER access the database directly.

## Shared utilities

- `@src/domain/shared/errors/service.error.ts` — `ServiceError` with typed error codes
- `@src/domain/shared/errors/error.filter.ts` — `ServiceErrorFilter` exception filter
- `@src/domain/shared/helpers/omit-undefined.ts` — strips undefined keys from update objects
- `@src/domain/shared/helpers/enum-object.ts` — `createEnumObject()` for string literal enums
- `@src/domain/shared/decorators/UUIDv7-param.decorator.ts` — `@UUIDv7Param()` for id params

## Anti-patterns

- NEVER access the database from controllers or resolvers.
- NEVER create circular module dependencies.
- NEVER define the domain model inside the service file — it lives in `<feature>.model.ts`.
