import { ModuleRef } from '@nestjs/core';
import {
  HttpStatus,
  INestApplication,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  VERSION_NEUTRAL,
  VersioningType,
} from '@nestjs/common';
import { setupGracefulShutdown } from '@tygra/nestjs-graceful-shutdown';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppConfig, Environment } from '@/config/app.config';
import { OpenApiService } from '@/tools/openapi/openapi.service';
import helmet from 'helmet';

export async function configure(
  app: INestApplication,
  appConfig: AppConfig,
) {
  // Configure Pino as the default logger with structured JSON output.
  // LoggerErrorInterceptor ensures errors are properly formatted in logs.
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // Set a global route prefix (e.g., '/api') for all controllers.
  // Individual routes will be prefixed with this value.
  app.setGlobalPrefix(appConfig.globalRoutePrefix);

  // Enable URI-based API versioning (e.g., /api/v1/users).
  // VERSION_NEUTRAL allows routes without an explicit version to be accessible.
  app.enableVersioning({
    defaultVersion: VERSION_NEUTRAL,
    type: VersioningType.URI,
  });

  // Configure global validation pipe for request payload validation.
  // - transform: Automatically transform payloads to DTO instances
  // - whitelist: Strip properties not defined in the DTO
  // - forbidNonWhitelisted: Throw error if unknown properties are present
  // - Returns 422 Unprocessable Entity for validation failures
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (errors: ValidationError[]) =>
        new UnprocessableEntityException(errors),
    }),
  );

  // Configure Helmet middleware for HTTP security headers.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`],
          fontSrc: [`'self'`],
          imgSrc: [`'self'`, 'data:'],
          scriptSrc: [`'self'`],
          connectSrc: [`'self'`],
        },
      },
    }),
  );

  // Configure CORS to allow cross-origin requests from specified origins.
  // Credentials are enabled to support cookie-based authentication.
  app.enableCors({
    origin: appConfig.corsOrigins,
    /* prettier-ignore */
    methods: [
      'GET','POST',
      'PATCH','PUT',
      'DELETE',
      'OPTIONS','HEAD',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-Id',
      'Accept',
    ],
    credentials: true,
  });

  // Enable graceful shutdown for zero-downtime deployments in non-development environments.
  if (appConfig.environment !== Environment.Development) {
    setupGracefulShutdown({ app });
  }

  // Set up OpenAPI documentation if the OpenapiModule was conditionally loaded.
  try {
    const moduleRef = app.get(ModuleRef);
    const openApiService = moduleRef.get(OpenApiService, {
      strict: false,
    });
    await openApiService.setup(app);
  } catch {
    // OpenapiModule not registered (non-development environment), skip
  }
}
