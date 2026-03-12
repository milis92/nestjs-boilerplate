import {
  DynamicModule,
  Global,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Pool } from 'pg';
import {
  AUTH_SCHEMA_NAME,
  BETTER_AUTH,
  createBetterAuth,
  type BetterAuthInstance,
} from '@/infra/auth/auth.factory';
import { testUtils } from 'better-auth/plugins';
import { AuthService } from '@/infra/auth/auth.service';
import { AuthGuard } from '@/infra/auth/auth.guard';
import { TestAuthContext } from '@/infra/auth/stubs/test-user.factory';
import type { PostgresConnectionConfig } from '@/infra/drizzle/stubs/test-drizzle.module';

@Global()
@Module({})
export class TestAuthModule implements OnModuleDestroy {
  constructor(private readonly pool: Pool) {}

  static forRoot(config: PostgresConnectionConfig): DynamicModule {
    return {
      module: TestAuthModule,
      providers: [
        {
          provide: Pool,
          useFactory: () =>
            new Pool({
              host: config.POSTGRES_HOST,
              port: config.POSTGRES_PORT,
              database: config.POSTGRES_DB,
              user: config.POSTGRES_USER,
              password: config.POSTGRES_PASSWORD,
              ssl: false,
              options: `-c search_path=${AUTH_SCHEMA_NAME}`,
            }),
        },
        {
          provide: BETTER_AUTH,
          inject: [Pool],
          useFactory: (pool: Pool) =>
            createBetterAuth({
              database: pool,
              secret: 'test-secret',
              baseUrl: 'http://localhost:3000',
              trustedOrigins: ['http://localhost:3000'],
              plugins: [testUtils()],
            }),
        },
        {
          provide: TestAuthContext,
          inject: [BETTER_AUTH],
          useFactory: async (auth: BetterAuthInstance) =>
            TestAuthContext.from(auth),
        },
        AuthService,
        AuthGuard,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      exports: [BETTER_AUTH, AuthService, TestAuthContext],
    };
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
