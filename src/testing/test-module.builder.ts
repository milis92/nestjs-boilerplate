import { Test, TestingModule } from '@nestjs/testing';
import { Type } from '@nestjs/common';
import { DynamicModule } from '@nestjs/common/interfaces/modules/dynamic-module.interface';
import { ForwardReference } from '@nestjs/common/interfaces/modules/forward-reference.interface';
import { inject } from 'vitest';
import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '@/infra/drizzle/drizzle.module';
import { TestDrizzleModule } from '@/infra/drizzle/stubs/test-drizzle.module';
import { TestCacheModule } from '@/infra/cache/stubs/test-cache.module';
import { TestAuthModule } from '@/infra/auth/stubs/test-auth.module';
import { TestAuthContext } from '@/infra/auth/stubs/test-user.factory';
import { TestLlmModule } from '@/infra/llm/stubs/test-llm.module';
import { TestQueueModule } from '@/infra/queue/stubs/test-queue.module';

export { type PostgresConnectionConfig } from '@/infra/drizzle/stubs/test-drizzle.module';

export class TestModuleContext {
  constructor(readonly moduleRef: TestingModule) {}

  get<T>(token: Type<T> | string | symbol): T {
    return this.moduleRef.get(token);
  }

  get database(): DrizzleDatabase {
    return this.get<DrizzleDatabase>(DRIZZLE_DB);
  }

  get auth(): TestAuthContext {
    return this.get(TestAuthContext);
  }

  async teardown(): Promise<void> {
    await this.moduleRef.close();
  }
}

export interface ProviderOverride {
  token: unknown;
  useValue: unknown;
}

export class TestModuleBuilder {
  static async create(
    module:
      | Type
      | DynamicModule
      | Promise<DynamicModule>
      | ForwardReference,
    overrides?: ProviderOverride[],
  ): Promise<TestModuleContext> {
    const config = inject('POSTGRES_CONNECTION_CONFIG');
    const redisConfig = inject('REDIS_CONNECTION_CONFIG');

    let builder = Test.createTestingModule({
      imports: [
        TestCacheModule,
        TestLlmModule,
        TestDrizzleModule.forRoot(config),
        TestAuthModule.forRoot(config),
        TestQueueModule.forRoot(redisConfig),
        module,
      ],
    });

    for (const override of overrides ?? []) {
      builder = builder
        .overrideProvider(override.token)
        .useValue(override.useValue);
    }

    const moduleRef = await builder.compile();

    return new TestModuleContext(moduleRef);
  }
}
