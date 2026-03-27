import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import type { Server } from 'http';
import type { GraphQLFormattedError } from 'graphql';

import { type DrizzleDatabase } from '@/infra/drizzle/drizzle.module';
import { AppConfig } from '@/config/app.config';
import { configure } from '@/configure';
import {
  TestModuleBuilder,
  TestModuleContext,
} from '@/testing/test-module.builder';
import { TestAuthContext } from '@/infra/auth/stubs/test-user.factory';
import { TestAppModule } from './test-app.module';

interface GraphQLResponse<T = Record<string, unknown>> {
  data?: T;
  errors?: GraphQLFormattedError[];
}

export class TestApplicationContext {
  private constructor(
    readonly app: INestApplication,
    private readonly _ctx: TestModuleContext,
  ) {}

  static async create(): Promise<TestApplicationContext> {
    const ctx = await TestModuleBuilder.create(
      TestAppModule.forRoot(),
    );

    const app = ctx.moduleRef.createNestApplication();

    const config = app.get(ConfigService);
    const appConfig = config.get<AppConfig>('application')!;

    await configure(app, appConfig);
    await app.init();

    return new TestApplicationContext(app, ctx);
  }

  get database(): DrizzleDatabase {
    return this._ctx.database;
  }

  get auth(): TestAuthContext {
    return this._ctx.auth;
  }

  async client(headers?: Record<string, string> | null) {
    const server = this.app.getHttpServer() as Server;
    const defaultUserId = await this.auth.defaultUserId();
    const effectiveHeaders =
      headers === null
        ? undefined
        : (headers ??
          (await this.auth.getAuthHeaders(defaultUserId)));
    return request.agent(server).set(effectiveHeaders ?? {});
  }

  async executeGraphql<T = Record<string, unknown>>(
    operation: {
      query: string;
      variables?: Record<string, unknown>;
    },
    headers?: Record<string, string> | null,
  ): Promise<GraphQLResponse<T>> {
    const response = await (await this.client(headers))
      .post('/graphql')
      .send(operation);

    return response.body as GraphQLResponse<T>;
  }

  async teardown(): Promise<void> {
    await this.app.close();
  }
}
