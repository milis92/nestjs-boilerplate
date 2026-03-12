import { Module } from '@nestjs/common';
import { ConditionalModule, ConfigModule } from '@nestjs/config';
import { GracefulShutdownModule } from '@tygra/nestjs-graceful-shutdown';
import { HealthModule } from '@/tools/health/health.module';
import applicationConfig, { Environment } from '@/config/app.config';
import { AppLoggerModule } from '@/tools/logger/logger.module';
import { OpenapiModule } from '@/tools/openapi/openapi.module';
import { FeaturesModule } from '@/domain/features.module';
import { InfraModule } from '@/infra/infra.module';

@Module({
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
    InfraModule,
    FeaturesModule,
    ConditionalModule.registerWhen(
      OpenapiModule,
      (env: NodeJS.ProcessEnv) =>
        env['NODE_ENV'] !== Environment.Production,
    ),
    HealthModule,
  ],
})
export class AppModule {}
