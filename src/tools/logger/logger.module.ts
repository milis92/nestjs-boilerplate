import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import applicationConfig, { AppConfig } from '@/config/app.config';
import loggerFactory from '@/tools/logger/logger.factory';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [applicationConfig.KEY],
      useFactory: (applicationConfig: AppConfig) =>
        loggerFactory(
          applicationConfig.logLevel,
          applicationConfig.logCollector,
        ),
    }),
  ],
})
export class AppLoggerModule {}
