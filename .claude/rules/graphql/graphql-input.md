---
paths:
    - "src/domain/**/graphql/inputs/*.ts"
---

## Naming

Input classes are named `<Action><Feature>Input` — never "DTO". Actions are `Create` or `Update`; filter inputs use a descriptive noun (e.g., `TransactionFilterInput`).

## @InputType

Decorate with `@InputType` passing a description:

```typescript
@InputType({ description: 'Input for creating a new widget' })
export class CreateWidgetInput { ... }
```

## @Field

Every `@Field()` must include a `description:` option. Nullable optional fields: `nullable: true` in `@Field()` and `field?: Type` in TypeScript:

```typescript
@Field(() => String, { nullable: true, description: 'Optional notes' })
@IsOptional()
@IsString()
notes?: string;
```

## Validator ordering

`@IsOptional()` always comes **first** in the class-validator stack, before any type-specific validators.

## toDomain

Expose an instance method `toDomain()` returning the service-layer type. Map every field individually — no `Object.assign`, no spread:

```typescript
toDomain(): CreateWidget {
  return {
    name: this.name,
    description: this.description ?? null,
  };
}
```

## Update inputs

All fields in an update input are optional: `nullable: true` on `@Field()`, `@IsOptional()` first, and `field?: Type` in TypeScript. Pass `undefined` through in `toDomain()` — do not set defaults — so the service layer can distinguish "not provided" from "explicitly set":

```typescript
toDomain(): UpdateWidget {
  return {
    name: this.name,        // undefined if not provided
    description: this.description,
  };
}
```

## Anti-patterns

- NEVER name a class `XxxDto` — use `<Action><Resource>Input`.
- NEVER use `Object.assign` or spread in `toDomain`.
- NEVER omit `description` from a `@Field()` decorator.
- NEVER put `@IsOptional()` after type-specific validators.

## Examples

@.claude/rules/graphql/examples/inputs/create-widget.input.ts
@.claude/rules/graphql/examples/inputs/update-widget.input.ts
