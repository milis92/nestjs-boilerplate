import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
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
import { ConfigService } from '@nestjs/config';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppConfig, Environment } from '@/config/app.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { DocsConfig } from '@/config/docs.config';
import setupOpenApi from '@/tools/openapi';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    {
      // Buffer logs until the Pino logger is ready, ensuring no logs are lost
      // during application startup
      bufferLogs: true,
    },
  );

  const config = app.get(ConfigService);
  const appConfig = config.get<AppConfig>('application')!;

  // Configure trusted proxies for deployments behind load balancers or reverse proxies.
  // This enables accurate client IP extraction from X-Forwarded-For headers,
  // which is essential for rate limiting and audit logging.
  app.set('trust proxy', appConfig.trustProxy);

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
  // CSP directives are configured to allow resources needed for API documentation
  // (Swagger UI, Scalar) while maintaining security against XSS attacks.
  app.use(
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
            `https: 'unsafe-inline'`,
            `cdn.jsdelivr.net`,
            `'unsafe-eval'`,
          ],
          connectSrc: [`'self'`, 'cdn.jsdelivr.net', 'unpkg.com'],
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

  // Environment-specific configuration:
  // - Production/Staging: Enable graceful shutdown for zero-downtime deployments
  // - Development: Enable OpenAPI documentation for API exploration
  if (appConfig.environment !== Environment.Development) {
    // Graceful shutdown ensures in-flight requests complete before the process exits,
    // preventing data loss and connection errors during deployments.
    setupGracefulShutdown({ app });
  } else {
    const docConfig = config.get<DocsConfig>('docs')!;
    await setupOpenApi(app, {
      path: docConfig.path,
      title: docConfig.title,
      description: docConfig.description,
      version: docConfig.version,
    });
  }

  await app.listen(appConfig.port, '0.0.0.0');
  return app;
}

bootstrap()
  .then(async (app: INestApplication) => {
    const url = await app.getUrl();
    console.log(`Server listening on ${url.toString()}`);
  })
  .catch((err) => {
    console.error(err);
  });
