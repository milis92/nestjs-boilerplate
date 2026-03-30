---
name: scaffold-rest
description: Create REST controller, request DTOs, and response DTO with OpenAPI decorators
---

# scaffold-rest

Creates the REST layer for a feature:
- `src/domain/<feature>/rest/<features>.controller.ts`
- `src/domain/<feature>/rest/requests/create-<feature>.request.ts`
- `src/domain/<feature>/rest/requests/update-<feature>.request.ts`
- `src/domain/<feature>/rest/responses/<feature>.response.ts`

## Inputs

- `feature` — singular lowercase (e.g., `widget`)
- `Feature` — PascalCase (e.g., `Widget`)
- `features` — plural lowercase (e.g., `widgets`)
- `Features` — PascalCase plural (e.g., `Widgets`)

## Template: Controller

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  NotFoundException,
} from '@nestjs/common';

import { ServiceErrorFilter } from '@/domain/shared/errors/error.filter';
import { UUIDv7Param } from '@/domain/shared/decorators/UUIDv7-param.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '@/infra/auth/auth.decorators';
import { OpenApiController } from '@/tools/openapi/openapi-controller.decorator';
import { OpenApiEndpoint } from '@/tools/openapi/openapi-endpoint.decorator';

import type { <Feature>Id } from '../<feature>.model';
import { <Features>Service } from '../<features>.service';
import { Create<Feature>Request } from './requests/create-<feature>.request';
import { Update<Feature>Request } from './requests/update-<feature>.request';
import { <Feature>Response } from './responses/<feature>.response';

@Controller('<features>')
@UseFilters(ServiceErrorFilter)
@OpenApiController('<Features>')
export class <Features>Controller {
  constructor(private readonly <features>Service: <Features>Service) {}

  @Get()
  @OpenApiEndpoint({
    summary: 'List all <features>',
    type: [<Feature>Response],
  })
  async findAll(
    @CurrentUser() user: AuthUser,
  ): Promise<<Feature>Response[]> {
    const <features> = await this.<features>Service.all(user.id);
    return <Feature>Response.fromDomainList(<features>);
  }

  @Get(':id')
  @OpenApiEndpoint({
    summary: 'Get a <feature> by ID',
    type: <Feature>Response,
  })
  async findOne(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: <Feature>Id,
  ): Promise<<Feature>Response> {
    const <feature> = await this.<features>Service.single(user.id, id);
    if (!<feature>)
      throw new NotFoundException(`<Feature> with id '${id}' not found`);
    return <Feature>Response.fromDomain(<feature>);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @OpenApiEndpoint({
    summary: 'Create a new <feature>',
    status: HttpStatus.CREATED,
    type: <Feature>Response,
  })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() request: Create<Feature>Request,
  ): Promise<<Feature>Response> {
    const <feature> = await this.<features>Service.create(
      user.id,
      request.toDomain(),
    );
    return <Feature>Response.fromDomain(<feature>);
  }

  @Patch(':id')
  @OpenApiEndpoint({
    summary: 'Update a <feature>',
    type: <Feature>Response,
  })
  async update(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: <Feature>Id,
    @Body() request: Update<Feature>Request,
  ): Promise<<Feature>Response> {
    const <feature> = await this.<features>Service.update(
      user.id,
      id,
      request.toDomain(),
    );
    return <Feature>Response.fromDomain(<feature>);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @OpenApiEndpoint({
    summary: 'Delete a <feature>',
    status: HttpStatus.NO_CONTENT,
  })
  async remove(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: <Feature>Id,
  ): Promise<void> {
    await this.<features>Service.delete(user.id, id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.CREATED)
  @OpenApiEndpoint({
    summary: 'Archive a <feature>',
    status: HttpStatus.CREATED,
    type: <Feature>Response,
  })
  async archive(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: <Feature>Id,
  ): Promise<<Feature>Response> {
    const <feature> = await this.<features>Service.archive(user.id, id);
    return <Feature>Response.fromDomain(<feature>);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.CREATED)
  @OpenApiEndpoint({
    summary: 'Restore an archived <feature>',
    status: HttpStatus.CREATED,
    type: <Feature>Response,
  })
  async restore(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: <Feature>Id,
  ): Promise<<Feature>Response> {
    const <feature> = await this.<features>Service.restore(user.id, id);
    return <Feature>Response.fromDomain(<feature>);
  }
}
```

## Template: CreateRequest

```typescript
import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  Length,
  ValidateIf,
} from 'class-validator';

import {
  <Feature>Status,
  type Create<Feature>,
  type <Feature>Status as <Feature>StatusType,
} from '@/domain/<feature>/<feature>.model';

@ApiSchema({ name: 'Create<Feature>Request' })
export class Create<Feature>Request {
  @ApiProperty({ description: 'Display name of the <feature>' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiProperty({
    description: 'Optional description',
    required: false,
    nullable: true,
  })
  @ValidateIf((o: Create<Feature>Request) => o.description !== null)
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    description: '<Feature> status',
    required: false,
    enum: Object.values(<Feature>Status),
  })
  @IsOptional()
  @IsIn(Object.values(<Feature>Status))
  status?: <Feature>StatusType;

  toDomain(): Create<Feature> {
    return {
      name: this.name,
      description: this.description ?? null,
      status: this.status ?? 'active',
    };
  }
}
```

## Template: UpdateRequest

```typescript
import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  Length,
  ValidateIf,
} from 'class-validator';

import { type Update<Feature> } from '@/domain/<feature>/<feature>.model';

@ApiSchema({ name: 'Update<Feature>Request' })
export class Update<Feature>Request {
  @ApiProperty({
    description: 'Display name of the <feature>',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiProperty({
    description: 'Optional description',
    required: false,
    nullable: true,
  })
  @ValidateIf((o: Update<Feature>Request) => o.description !== null)
  @IsOptional()
  @IsString()
  description?: string | null;

  toDomain(): Update<Feature> {
    return {
      name: this.name,
      description: this.description,
    };
  }
}
```

## Template: Response

```typescript
import { ApiSchema, ApiProperty } from '@nestjs/swagger';

import {
  <Feature>,
  type <Feature>Status,
} from '@/domain/<feature>/<feature>.model';

@ApiSchema({ name: '<Feature>Response' })
export class <Feature>Response {
  @ApiProperty({ description: 'Unique identifier (UUIDv7)' })
  id!: string;

  @ApiProperty({ description: 'Display name of the <feature>' })
  name!: string;

  @ApiProperty({
    description: 'Optional description',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ description: '<Feature> status' })
  status!: <Feature>Status;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    nullable: true,
  })
  updatedAt!: Date | null;

  static fromDomain(entity: <Feature>): <Feature>Response {
    const response = new <Feature>Response();
    response.id = entity.id;
    response.name = entity.name;
    response.description = entity.description;
    response.status = entity.status;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    return response;
  }

  static fromDomainList(entities: <Feature>[]): <Feature>Response[] {
    return entities.map((e) => <Feature>Response.fromDomain(e));
  }
}
```

## Adapt the templates

- Replace all `<feature>` / `<Feature>` / `<features>` / `<Features>` with actual names.
- Adjust request fields to match the domain's `CreateFoo` / `UpdateFoo` types.
- Adjust response fields to match the domain model properties.
- If no status enum, remove the status field from CreateRequest and its `@IsIn` validator.
- If no archive/restore, remove those controller methods.

## Validation patterns

| Field type               | Decorators                                                                         | DTO property example      |
|--------------------------|------------------------------------------------------------------------------------|---------------------------|
| Required string          | `@IsString() @Length(1, 255)`                                                      | `name!: string`           |
| Optional nullable string | `@ValidateIf((o: CreateFooRequest) => o.notes !== null) @IsOptional() @IsString()` | `notes?: string \| null`  |
| Optional enum            | `@IsOptional() @IsIn(Object.values(FooStatus))`                                    | `status?: FooStatusType`  |
| Optional boolean         | `@IsOptional() @IsBoolean()`                                                       | `pinned: boolean = false` |

## Verify

Read `.claude/rules/rest.md` and check:
- Every `!IMPORTANT` constraint — confirm the code complies
- Every `NEVER` in anti-patterns — confirm no violations
Fix any issues before committing. Report file:line for failures.
