---
paths:
    - "src/domain/**/graphql/objects/*.ts"
---

## Naming

Object classes are named `<Feature>Object` (singular, e.g., `AccountObject`).

## @ObjectType

Decorate with `@ObjectType` passing a description:

```typescript
@ObjectType({ description: 'A widget entity' })
export class WidgetObject { ... }
```

## @Field

Every `@Field()` must include a `description:` option. Pass an explicit type factory for any non-primitive type:

```typescript
@Field(() => ID, { description: 'Unique identifier' })
id!: string;

@Field(() => Date, { nullable: true, description: 'Last updated timestamp' })
updatedAt!: Date | null;
```

**Nullable fields:** set `nullable: true` in `@Field()` and use `Type | null` in TypeScript — never `Type | undefined`.

## Enums

Register domain enums with `registerEnumType` before they are referenced in a `@Field()`:

```typescript
registerEnumType(WidgetStatusEnum, {
  name: 'WidgetStatus',
  description: 'Status of a widget',
});
```

## fromDomain / fromDomainList

Expose two static factory methods. Assign every field individually on a new instance — no `Object.assign`, no spread:

```typescript
static fromDomain(widget: Widget): WidgetObject {
  const obj = new WidgetObject();
  obj.id = widget.id;
  // ...
  return obj;
}

static fromDomainList(widgets: Widget[]): WidgetObject[] {
  return widgets.map((w) => WidgetObject.fromDomain(w));
}
```

## Anti-patterns

- NEVER use `Object.assign` or spread (`{ ...entity }`) in `fromDomain`.
- NEVER omit `description` from a `@Field()` decorator.
- NEVER use `Type | undefined` for a nullable field — use `Type | null`.

## Example

@.claude/rules/graphql/examples/objects/widget.object.ts
