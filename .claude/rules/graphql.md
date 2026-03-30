---
paths:
  - "src/domain/**/graphql/**"
---

# GraphQL Layer (Apollo)

> Constraints for GraphQL resolvers, object types, and input types. The matching `/scaffold-graphql` skill provides code templates.

## Naming

| Type       | File pattern           | Class name                               |
|------------|------------------------|------------------------------------------|
| Resolver   | `<module>.resolver.ts` | `<Module>sResolver` (plural)             |
| ObjectType | `<module>.object.ts`   | `<Module>Object` (singular)              |
| InputType  | `<module>.input.ts`    | `Create<Module>Input`, `Update<Module>Input` |
| Enum       | (in object file)       | `<Module>TypeEnum`                       |

- !IMPORTANT: File names are **singular** for types (`widget.object.ts`), **plural** for the resolver (`widgets.resolver.ts`).
- !IMPORTANT: Unlike REST, GraphQL `UpdateFooInput` extends `PartialType(CreateFooInput)` to make all fields optional.
- Import domain model from `@/domain/<feature>/<feature>.model` (not the service file) for `fromDomain()`.
- Import `PartialType` from `@nestjs/graphql` (not `@nestjs/swagger`).

## Enum registration

- Define a TypeScript enum with SCREAMING_CASE keys mapping to lowercase database values (e.g., `ACTIVE = 'active'`).
- Register via `registerEnumType(FooTypeEnum, { name: 'FooType' })`.
- !IMPORTANT: Place the enum definition and registration in the object type file (`<feature>.object.ts`), not in a separate file.

## Resolver conventions

- `@Resolver(() => FooObject)` — always specify the ObjectType in the decorator argument.
- `@UseFilters(ServiceErrorFilter)` on the resolver class — from `@/domain/shared/errors/error.filter`.
- Throw `NotFoundException` in the resolver for not-found single queries.
- `ServiceError` instances propagate through the filter automatically.
- Import service from `../<feature>.service` (relative) and types from `../<feature>.model` (relative).

## Anti-patterns

- NEVER reuse REST/tables enum types in GraphQL -- register separate TypeScript enums with `registerEnumType()`.
- NEVER convert BigInt in InputTypes -- convert in the resolver (`BigInt(input.field)`).
- NEVER use plain spread for update mutations -- use conditional spread (`...(input.field !== undefined && { field: input.field })`) to exclude undefined fields.
- NEVER skip `@UseFilters(ServiceErrorFilter)` on resolvers.
