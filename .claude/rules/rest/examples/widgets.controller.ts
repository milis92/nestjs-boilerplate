// Example: src/domain/widget/rest/widgets.controller.ts

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

import type { WidgetId } from '../widget.model';
import { WidgetsService } from '../widgets.service';
import { CreateWidgetRequest } from './requests/create-widget.request';
import { UpdateWidgetRequest } from './requests/update-widget.request';
import { WidgetResponse } from './responses/widget.response';

@Controller('widgets')
@UseFilters(ServiceErrorFilter)
@OpenApiController('Widgets')
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get()
  @OpenApiEndpoint({
    summary: 'List all widgets',
    type: [WidgetResponse],
  })
  async all(
    @CurrentUser() user: AuthUser,
  ): Promise<WidgetResponse[]> {
    const widgets = await this.widgetsService.all(user.id);
    return WidgetResponse.fromDomainList(widgets);
  }

  @Get(':id')
  @OpenApiEndpoint({
    summary: 'Get a widget by ID',
    type: WidgetResponse,
  })
  async single(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: WidgetId,
  ): Promise<WidgetResponse> {
    const widget = await this.widgetsService.single(user.id, id);
    if (!widget)
      throw new NotFoundException(`Widget with id '${id}' not found`);
    return WidgetResponse.fromDomain(widget);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @OpenApiEndpoint({
    summary: 'Create a new widget',
    status: HttpStatus.CREATED,
    type: WidgetResponse,
  })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() request: CreateWidgetRequest,
  ): Promise<WidgetResponse> {
    const widget = await this.widgetsService.create(
      user.id,
      request.toDomain(),
    );
    return WidgetResponse.fromDomain(widget);
  }

  @Patch(':id')
  @OpenApiEndpoint({
    summary: 'Update a widget',
    type: WidgetResponse,
  })
  async update(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: WidgetId,
    @Body() request: UpdateWidgetRequest,
  ): Promise<WidgetResponse> {
    const widget = await this.widgetsService.update(
      user.id,
      id,
      request.toDomain(),
    );
    return WidgetResponse.fromDomain(widget);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @OpenApiEndpoint({
    summary: 'Delete a widget',
    status: HttpStatus.NO_CONTENT,
  })
  async remove(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: WidgetId,
  ): Promise<void> {
    await this.widgetsService.delete(user.id, id);
  }
}
