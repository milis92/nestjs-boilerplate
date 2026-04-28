// Example: src/domain/widget/graphql/widgets.resolver.ts

import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseFilters, NotFoundException } from '@nestjs/common';

import { ServiceErrorFilter } from '@/domain/shared/errors/error.filter';
import {
  CurrentUser,
  type AuthUser,
} from '@/infra/auth/auth.decorators';

import { WidgetsService } from '../widgets.service';
import { WidgetObject } from './objects/widget.object';
import { CreateWidgetInput } from './inputs/create-widget.input';
import { UpdateWidgetInput } from './inputs/update-widget.input';

@Resolver(() => WidgetObject)
@UseFilters(ServiceErrorFilter)
export class WidgetsResolver {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Query(() => [WidgetObject], {
    name: 'widgets',
    description: 'Get all widgets',
  })
  async widgets(
    @CurrentUser() user: AuthUser,
  ): Promise<WidgetObject[]> {
    const widgets = await this.widgetsService.all(user.id);
    return WidgetObject.fromDomainList(widgets);
  }

  @Query(() => WidgetObject, {
    name: 'widget',
    description: 'Get widget by ID',
  })
  async widget(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
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
    const widget = await this.widgetsService.create(
      user.id,
      input.toDomain(),
    );
    return WidgetObject.fromDomain(widget);
  }

  @Mutation(() => WidgetObject, {
    description: 'Update an existing widget',
  })
  async updateWidget(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateWidgetInput,
  ): Promise<WidgetObject> {
    const widget = await this.widgetsService.update(
      user.id,
      id,
      input.toDomain(),
    );
    return WidgetObject.fromDomain(widget);
  }

  @Mutation(() => Boolean, { description: 'Delete a widget' })
  async deleteWidget(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.widgetsService.delete(user.id, id);
    return true;
  }
}
