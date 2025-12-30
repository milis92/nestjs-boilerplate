import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GracefulShutdownModule } from '@tygra/nestjs-graceful-shutdown';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { CacheModule } from './infra/cache/cache.module';
import { DatabaseModule } from './infra/database/database.module';
import applicationConfig, { AppConfig } from '@/config/app.config';
import loggerFactory from '@/tools/logger';
import { RateLimiterModule } from '@/infra/rate_limiter/rate_limiter.module';
import { AuthModule } from '@/infra/auth/auth.module';
import docsConfig from '@/config/docs.config';
import { GraphqlModule } from '@/infra/graphql/graphql.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [applicationConfig, docsConfig],
      expandVariables: true,
      skipProcessEnv: true,
      cache: true,
      isGlobal: true,
    }),
    GracefulShutdownModule.forRoot(),
    LoggerModule.forRootAsync({
      inject: [applicationConfig.KEY],
      useFactory: (applicationConfig: AppConfig) =>
        loggerFactory(
          applicationConfig.logLevel,
          applicationConfig.logCollector,
        ),
    }),
    DatabaseModule,
    RateLimiterModule,
    CacheModule,
    AuthModule,
    GraphqlModule,
    HealthModule,
  ],
})
export class AppModule {}
