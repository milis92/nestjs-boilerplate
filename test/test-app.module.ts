import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GracefulShutdownModule } from '@tygra/nestjs-graceful-shutdown';
import { GraphqlModule } from '@/infra/graphql/graphql.module';
import { FeaturesModule } from '@/domain/features.module';
import { TestCacheModule } from '@/infra/cache/stubs/test-cache.module';
import { TestRateLimiterModule } from '@/infra/rate_limiter/stubs/test-rate-limiter.module';
import applicationConfig from '@/config/app.config';
import { AppLoggerModule } from '@/tools/logger/logger.module';

@Module({})
export class TestAppModule {
  static forRoot(): DynamicModule {
    return {
      module: TestAppModule,
      imports: [
        ConfigModule.forRoot({
          load: [applicationConfig],
          expandVariables: true,
          skipProcessEnv: true,
          cache: true,
          isGlobal: true,
        }),
        GracefulShutdownModule.forRoot(),
        AppLoggerModule,
        TestCacheModule,
        TestRateLimiterModule,
        GraphqlModule,
        FeaturesModule,
      ],
    };
  }
}
