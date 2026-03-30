---
name: scaffold-graphql
description: Create GraphQL resolver, object type with enum registration, and input types
---

# scaffold-graphql

Creates the GraphQL layer for a feature:
- `src/domain/<feature>/graphql/<feature>.object.ts`
- `src/domain/<feature>/graphql/<feature>.input.ts`
- `src/domain/<feature>/graphql/<features>.resolver.ts`

## Inputs

- `feature` — singular lowercase (e.g., `widget`)
- `Feature` — PascalCase (e.g., `Widget`)
- `features` — plural lowercase (e.g., `widgets`)
- `Features` — PascalCase plural (e.g., `Widgets`)

## Template: ObjectType

```typescript
import {
  Field,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import { <Feature> } from '@/domain/<feature>/<feature>.model';

export enum <Feature>StatusEnum {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

registerEnumType(<Feature>StatusEnum, {
  name: '<Feature>Status',
  description: 'Status of a <feature>',
});

@ObjectType({ description: 'A <feature> entity' })
export class <Feature>Object {
  @Field(() => ID, { description: 'Unique identifier (UUIDv7)' })
  id!: string;

  @Field(() => String, { description: 'Display name of the <feature>' })
  name!: string;

  @Field(() => String, {
    description: 'Optional description',
    nullable: true,
  })
  description!: string | null;

  @Field(() => <Feature>StatusEnum, { description: '<Feature> status' })
  status!: <Feature>StatusEnum;

  @Field(() => Date, { description: 'Creation timestamp' })
  createdAt!: Date;

  @Field(() => Date, {
    description: 'Last update timestamp',
    nullable: true,
  })
  updatedAt!: Date | null;

  static fromDomain(<feature>: <Feature>): <Feature>Object {
    const obj = new <Feature>Object();
    obj.id = <feature>.id;
    obj.name = <feature>.name;
    obj.description = <feature>.description;
    obj.status = <feature>.status as <Feature>StatusEnum;
    obj.createdAt = <feature>.createdAt;
    obj.updatedAt = <feature>.updatedAt;
    return obj;
  }

  static fromDomainList(<features>: <Feature>[]): <Feature>Object[] {
    return <features>.map((w) => <Feature>Object.fromDomain(w));
  }
}
```

## Template: InputTypes

```typescript
import { Field, InputType, PartialType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  Length,
  ValidateIf,
} from 'class-validator';

@InputType({ description: 'Input for creating a new <feature>' })
export class Create<Feature>Input {
  @Field(() => String, { description: 'Display name of the <feature>' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @Field(() => String, {
    description: 'Optional description',
    nullable: true,
  })
  @ValidateIf((o) => o.description !== null)
  @IsOptional()
  @IsString()
  description?: string | null;
}

@InputType({ description: 'Input for updating an existing <feature>' })
export class Update<Feature>Input extends PartialType(
  Create<Feature>Input,
) {}
```

## Template: Resolver

```typescript
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseFilters, NotFoundException } from '@nestjs/common';

import { ServiceErrorFilter } from '@/domain/shared/errors/error.filter';
import {
  CurrentUser,
  type AuthUser,
} from '@/infra/auth/auth.decorators';

import type { <Feature>Id } from '../<feature>.model';
import { <Features>Service } from '../<features>.service';
import { <Feature>Object } from './<feature>.object';
import { Create<Feature>Input, Update<Feature>Input } from './<feature>.input';

@Resolver(() => <Feature>Object)
@UseFilters(ServiceErrorFilter)
export class <Features>Resolver {
  constructor(private readonly <features>Service: <Features>Service) {}

  @Query(() => [<Feature>Object], { name: '<features>' })
  async <features>(
    @CurrentUser() user: AuthUser,
  ): Promise<<Feature>Object[]> {
    const <features> = await this.<features>Service.all(user.id);
    return <Feature>Object.fromDomainList(<features>);
  }

  @Query(() => <Feature>Object, { name: '<feature>' })
  async <feature>(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: <Feature>Id,
  ): Promise<<Feature>Object> {
    const <feature> = await this.<features>Service.single(user.id, id);
    if (!<feature>)
      throw new NotFoundException(`<Feature> with id '${id}' not found`);
    return <Feature>Object.fromDomain(<feature>);
  }

  @Mutation(() => <Feature>Object, {
    description: 'Create a new <feature>',
  })
  async create<Feature>(
    @CurrentUser() user: AuthUser,
    @Args('input') input: Create<Feature>Input,
  ): Promise<<Feature>Object> {
    const <feature> = await this.<features>Service.create(user.id, {
      name: input.name,
      description: input.description ?? null,
      status: 'active',
    });
    return <Feature>Object.fromDomain(<feature>);
  }

  @Mutation(() => <Feature>Object, {
    description: 'Update an existing <feature>',
  })
  async update<Feature>(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: <Feature>Id,
    @Args('input') input: Update<Feature>Input,
  ): Promise<<Feature>Object> {
    const <feature> = await this.<features>Service.update(user.id, id, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description ?? null,
      }),
    });
    return <Feature>Object.fromDomain(<feature>);
  }

  @Mutation(() => Boolean, { description: 'Delete a <feature>' })
  async delete<Feature>(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: <Feature>Id,
  ): Promise<boolean> {
    await this.<features>Service.delete(user.id, id);
    return true;
  }

  @Mutation(() => <Feature>Object, { description: 'Archive a <feature>' })
  async archive<Feature>(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: <Feature>Id,
  ): Promise<<Feature>Object> {
    const <feature> = await this.<features>Service.archive(user.id, id);
    return <Feature>Object.fromDomain(<feature>);
  }

  @Mutation(() => <Feature>Object, {
    description: 'Restore an archived <feature>',
  })
  async restore<Feature>(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: <Feature>Id,
  ): Promise<<Feature>Object> {
    const <feature> = await this.<features>Service.restore(user.id, id);
    return <Feature>Object.fromDomain(<feature>);
  }
}
```

## ObjectType field type reference

| Domain type | `@Field` type argument | Example |
|---|---|---|
| `string` | `() => String` | `@Field(() => String)` |
| `string \| null` | `() => String, { nullable: true }` | `@Field(() => String, { nullable: true })` |
| `boolean` | `() => Boolean` | `@Field(() => Boolean)` |
| `number` (int) | `() => Int` | `@Field(() => Int)` (import `Int` from `@nestjs/graphql`) |
| `Date` | `() => Date` | `@Field(() => Date)` |
| `Date \| null` | `() => Date, { nullable: true }` | `@Field(() => Date, { nullable: true })` |

## Adapt the templates

- Replace all `<feature>` / `<Feature>` / `<features>` / `<Features>` with actual names.
- Adjust enum values to match the actual domain enum.
- Adjust object type fields to match the domain model.
- Adjust input type fields to match CreateFoo requirements.
- Use conditional spread in update mutation for each updatable field.
- If no status enum, remove the enum definition/registration and archive/restore mutations.

## Verify

Read `.claude/rules/graphql.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
