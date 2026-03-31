// Example: src/domain/widget/graphql/widgets.resolver.ts

import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseFilters, NotFoundException } from '@nestjs/common';

import { ServiceErrorFilter } from '@/domain/shared/errors/error.filter';
import {
  CurrentUser,
  type AuthUser,
} from '@/infra/auth/auth.decorators';

import type {
  WidgetId,
  CreateWidget,
  UpdateWidget,
} from '../widget.model';
import { WidgetsService } from '../widgets.service';
import { WidgetObject } from './widget.object';
import { CreateWidgetInput, UpdateWidgetInput } from './widget.input';

@Resolver(() => WidgetObject)
@UseFilters(ServiceErrorFilter)
export class WidgetsResolver {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Query(() => [WidgetObject], { name: 'widgets' })
  async widgets(
    @CurrentUser() user: AuthUser,
  ): Promise<WidgetObject[]> {
    const widgets = await this.widgetsService.all(user.id);
    return WidgetObject.fromDomainList(widgets);
  }

  @Query(() => WidgetObject, { name: 'widget' })
  async widget(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: WidgetId,
  ): Promise<WidgetObject> {
    const widget = await this.widgetsService.single(user.id, id);
    if (!widget)
      throw new NotFoundException(`Widget with id '${id}' not found`);
    return WidgetObject.fromDomain(widget);
  }

  @Mutation(() => WidgetObject, {
    description: 'Create a new widget',
  })
  async createWidget(
    @CurrentUser() user: AuthUser,
    @Args('input') input: CreateWidgetInput,
  ): Promise<WidgetObject> {
    const domain: CreateWidget = {
      name: input.name,
      description: input.description ?? null,
      status: 'active',
      priority: input.priority ?? 0,
    };
    const widget = await this.widgetsService.create(user.id, domain);
    return WidgetObject.fromDomain(widget);
  }

  @Mutation(() => WidgetObject, {
    description: 'Update an existing widget',
  })
  async updateWidget(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: WidgetId,
    @Args('input') input: UpdateWidgetInput,
  ): Promise<WidgetObject> {
    const domain: UpdateWidget = {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description ?? null,
      }),
      ...(input.priority !== undefined && {
        priority: input.priority,
      }),
    };
    const widget = await this.widgetsService.update(
      user.id,
      id,
      domain,
    );
    return WidgetObject.fromDomain(widget);
  }

  @Mutation(() => Boolean, { description: 'Delete a widget' })
  async deleteWidget(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: WidgetId,
  ): Promise<boolean> {
    await this.widgetsService.delete(user.id, id);
    return true;
  }
}
