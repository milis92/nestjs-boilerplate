---
paths:
    - "src/domain/**/graphql/*.resolver.ts"
---

## Class-level decorator stack

Every domain resolver uses exactly these two decorators, in this order:

```typescript
@Resolver(() => PrimaryObject)
@UseFilters(ServiceErrorFilter)
export class FeaturesResolver { ... }
```

- `@Resolver(() => PrimaryObject)` — pass the primary `ObjectType` class. Use bare `@Resolver()` only when a resolver owns multiple unrelated types (e.g., a resolver that handles both `CategoryObject` and `CategoryGroupObject`).
- `@UseFilters(ServiceErrorFilter)` — translates `ServiceError` from the service layer into GraphQL errors. Import from `@/domain/shared/errors/error.filter`.

## Resolver methods

- Inject the authenticated user with `@CurrentUser() user: AuthUser`. Always pass `user.id` to service calls — never the whole user object.
- Declare all methods `async` with an explicit `Promise<T>` return type.

## @Query

!IMPORTANT: Every `@Query()` must include both `name` and `description` options. The `name` is the GraphQL operation name clients call; without it NestJS falls back to the method name:

```typescript
@Query(() => [AccountObject], {
  name: 'accounts',
  description: 'Get all accounts',
})
async findAll(@CurrentUser() user: AuthUser): Promise<AccountObject[]> { ... }
```

## @Mutation

Every `@Mutation()` must include a `description` option.

## ID arguments

Always declare ID args with an explicit type factory — omitting it causes NestJS to infer `String` and lose the GraphQL `ID` scalar:

```typescript
@Args('id', { type: () => ID }) id: string
```

## Not-found handling

Throw `NotFoundException` inline when `single()` returns null — that is the only business decision resolvers make. Mutations (update, delete) do not need a null guard; the service throws `ServiceError` for missing resources:

```typescript
if (!result) throw new NotFoundException(`Widget with id '${id}' not found`);
```

## Delete mutations

Delete mutations return `Promise<boolean>`. After calling the service, `return true`:

```typescript
@Mutation(() => Boolean, { description: 'Delete a widget' })
async deleteWidget(...): Promise<boolean> {
  await this.widgetsService.delete(user.id, id);
  return true;
}
```

## Input/output transformation

- Call `input.toDomain()` — never pass the raw input object to the service.
- Call `XxxObject.fromDomain(result)` or `XxxObject.fromDomainList(results)` — never construct object types manually.

## Anti-patterns

- NEVER put business logic in a resolver — that belongs in the service.
- NEVER omit `@UseFilters(ServiceErrorFilter)` from a domain resolver.
- NEVER omit `name:` from a `@Query()` decorator.

## Full example

@.claude/rules/graphql/examples/widgets.resolver.ts
