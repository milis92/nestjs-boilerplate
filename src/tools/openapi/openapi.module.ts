import {
  Module,
  Global,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import helmet from 'helmet';

import docsConfig from '@/config/docs.config';
import { ConfigModule } from '@nestjs/config';
import { OpenApiController } from '@/tools/openapi/openapi.controller';
import { OpenApiService } from '@/tools/openapi/openapi.service';

/**
 * Module that provides OpenAPI documentation via Scalar API Reference UI.
 *
 * ### Purpose
 *
 * This module sets up Swagger/OpenAPI documentation and serves it through
 * the Scalar API Reference UI. It also configures the CSP headers necessary
 * for the documentation UI to function correctly.
 *
 * ### Conditional Usage
 *
 * This module should only be imported in development environments.
 * When imported, it automatically sets up documentation on init.
 * When not imported, no documentation-related code runs.
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(docsConfig)],
  controllers: [OpenApiController],
  providers: [OpenApiService],
})
export class OpenapiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        helmet({
          crossOriginEmbedderPolicy: false,
          contentSecurityPolicy: {
            directives: {
              defaultSrc: [`'self'`, 'unpkg.com'],
              styleSrc: [
                `'self'`,
                `'unsafe-inline'`,
                'cdn.jsdelivr.net',
                'fonts.googleapis.com',
                'unpkg.com',
              ],
              fontSrc: [`'self'`, 'fonts.scalar.com', 'data:'],
              imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
              scriptSrc: [
                `'self'`,
                `https:`,
                `'unsafe-inline'`,
                `cdn.jsdelivr.net`,
                `'unsafe-eval'`,
              ],
              connectSrc: [`'self'`, 'cdn.jsdelivr.net', 'unpkg.com'],
            },
          },
        }),
      )
      .forRoutes(OpenApiController);
  }
}
