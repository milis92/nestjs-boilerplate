---
paths:
  - "src/domain/**/graphql/**"
---

# GraphQL Layer (Apollo)

> Resolvers, object types, and input types for GraphQL queries and mutations.

## Naming

| Type       | File pattern             | Class name                                     |
|------------|--------------------------|------------------------------------------------|
| Resolver   | `<features>.resolver.ts` | `<Features>Resolver` (plural)                  |
| ObjectType | `<feature>.object.ts`    | `<Feature>Object` (singular)                   |
| InputType  | `<feature>.input.ts`     | `Create<Feature>Input`, `Update<Feature>Input` |
| Enum       | (in object file)         | `<Feature>StatusEnum`                          |

- !IMPORTANT: File names are **singular** for types (`widget.object.ts`), **plural** for the resolver (`widgets.resolver.ts`).
- !IMPORTANT: Unlike REST, GraphQL `UpdateFooInput` extends `PartialType(CreateFooInput)` to make all fields optional.
- Import `PartialType` from `@nestjs/graphql` (not `@nestjs/swagger`).

## Enum Registration

Define a TypeScript enum with SCREAMING_CASE keys mapping to lowercase database values, then register it:

```typescript
export enum WidgetStatusEnum {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

registerEnumType(WidgetStatusEnum, { name: 'WidgetStatus' });
```

- !IMPORTANT: Place the enum definition and registration in the object type file (`<feature>.object.ts`).

## Resolver Conventions

```typescript
@Resolver(() => WidgetObject)
@UseFilters(ServiceErrorFilter)
export class WidgetsResolver { ... }
```

- `@Resolver(() => FooObject)` — always specify the ObjectType.
- `@UseFilters(ServiceErrorFilter)` on the resolver class.
- Throw `NotFoundException` for not-found single queries.

## Update Mutation Pattern

Use conditional spread to exclude undefined fields:

```typescript
const domain: UpdateWidget = {
  ...(input.name !== undefined && { name: input.name }),
  ...(input.description !== undefined && { description: input.description ?? null }),
};
```

## ObjectType Field Reference

| Domain type      | `@Field` type argument             |
|------------------|------------------------------------|
| `string`         | `() => String`                     |
| `string \| null` | `() => String, { nullable: true }` |
| `number` (int)   | `() => Int`                        |
| `number` (float) | `() => Float`                      |
| `Date`           | `() => Date`                       |
| `Date \| null`   | `() => Date, { nullable: true }`   |

## Anti-patterns

- NEVER reuse REST enum types in GraphQL — register separate TypeScript enums with `registerEnumType()`.
- NEVER use plain spread for update mutations — use conditional spread to exclude undefined fields.
- NEVER skip `@UseFilters(ServiceErrorFilter)` on resolvers.

## Full Example

For complete working implementations, see:
- `.claude/rules/graphql/examples/widget.object.ts`
- `.claude/rules/graphql/examples/widget.input.ts`
- `.claude/rules/graphql/examples/widgets.resolver.ts`
