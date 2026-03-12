---
paths:
  - "src/domain/**/graphql/**"
  - "src/infra/graphql/**"
---

# GraphQL Layer (Apollo)

Rules for implementing GraphQL resolvers, object types, and input types in domain modules.

**Reference implementation**: `src/domain/accounts/graphql/`

## Naming

| Type       | File pattern           | Example              | Class name                             |
|------------|------------------------|----------------------|----------------------------------------|
| Resolver   | `<module>.resolver.ts` | `widgets.resolver.ts`| `WidgetsResolver`                      |
| ObjectType | `<module>.object.ts`   | `widget.object.ts`   | `WidgetObject`                         |
| InputType  | `<module>.input.ts`    | `widget.input.ts`    | `CreateWidgetInput`, `UpdateWidgetInput`|
| Enum       | (in object file)       |                      | `WidgetTypeEnum`                       |

Note: file names are **singular** for GraphQL types (`widget.object.ts`), **plural** for the resolver (`widgets.resolver.ts`).

## Object types (`<module>.object.ts`)

### Enum registration

Define a TypeScript enum mirroring the database enum values exactly, then register it. Do not reuse enums from the tables file.

```typescript
export enum FooTypeEnum {
  alpha = 'alpha',
  beta = 'beta',
}

registerEnumType(FooTypeEnum, { name: 'FooType', description: 'Type of foo' });
```

### ObjectType conventions

- `() => ID` for identifier fields.
- `() => Date` with `nullable: true` for optional dates.
- `() => String` with `nullable: true` for optional strings.
- Cast domain enums to the GraphQL enum type in `fromDomain()`.
- BigInt to String conversion happens in `fromDomain()`.
- Provide both `static fromDomain()` and `static fromDomainList()`.

## Input types (`<module>.input.ts`)

- `UpdateFooInput` extends `PartialType(CreateFooInput)` to make all fields optional.
- Use `class-validator` decorators for validation.
- BigInt fields are received as strings; conversion happens in the resolver.

## Resolver (`<module>.resolver.ts`)

### Naming

- Queries: plural for list (`foos`), singular for single (`foo`).
- Mutations: `createFoo`, `updateFoo`, `deleteFoo`, `archiveFoo`, `restoreFoo`.

### Arguments

- ID: `@Args('id', { type: () => ID })`.
- Input: `@Args('input') input: CreateFooInput`.

### Return types

- Delete mutations return `Boolean` (always `true` on success; throws on failure).
- All other mutations and queries return the ObjectType.

### Update mutations

Use conditional spread to exclude undefined fields:

```typescript
const foo = await this.foosService.update(user.id, id, {
  ...(input.name !== undefined && { name: input.name }),
  ...(input.balance !== undefined && { balance: BigInt(input.balance) }),
});
```

### Error handling

- Apply `@UseFilters(ServiceErrorFilter)` on the resolver class.
- `ServiceErrorFilter` re-throws errors to let NestJS GraphQL handle them.
- Throw `NotFoundException` in the resolver for not-found single queries.
- Service-level `ServiceError` instances propagate through the filter automatically.

## Anti-patterns

- Do not reuse REST/tables enum types in GraphQL. Register separate TypeScript enums with `registerEnumType()`.
- Do not convert BigInt in InputTypes. Convert in the resolver (`BigInt(input.field)`).
- Do not use plain spread for update mutations. Use conditional spread (`...(input.field !== undefined && { field: input.field })`) to exclude undefined fields.
- Do not skip `@UseFilters(ServiceErrorFilter)` on resolvers.
