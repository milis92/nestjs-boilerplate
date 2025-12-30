import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { registerAs } from '@nestjs/config';
import validatedConfig from '@/config/utils/validate-config';
import {
  Expose,
  Transform,
  TransformFnParams,
} from 'class-transformer';
import { IsCorsOrigin } from '@/config/utils/cors.validator';

export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export enum LogCollector {
  Console = 'console',
}

export enum LogLevel {
  none = 'silent',
  trace = 'trace',
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
  fatal = 'fatal',
}

/**
 * Resolves and normalizes CORS origin string into the appropriate format.
 * Handles special values (true/false/*) and comma-separated lists.
 * Automatically adds localhost/127.0.0.1 and www variants.
 */
function resolveCorsOrigin(
  origin: string,
): boolean | string | string[] {
  if (origin === 'true') return true;
  if (origin === '*') return '*';
  if (!origin || origin === 'false') return false;

  const origins = origin.split(',').map((origin) => origin.trim());

  // Add localhost/127.0.0.1 equivalents
  const localhost = origins
    .map((origin) =>
      origin?.startsWith('http://localhost')
        ? origin?.replace('http://localhost', 'http://127.0.0.1')
        : origin,
    )
    .filter((origin, index) => origin !== origins[index]);
  origins.push(...localhost);

  // Add www variants for https URLs
  const wwwOrigins = origins
    .map((origin) =>
      origin?.startsWith('https://')
        ? origin?.replace('https://', 'https://www.')
        : origin,
    )
    .filter((origin, index) => origin !== origins[index]);
  origins.push(...wwwOrigins);

  return origins;
}

/**
 * Resolves and normalizes trust proxy setting.
 * Supports boolean, number, string (IP/CIDR/special), or array of strings.
 */
function resolveTrustProxy(
  value: string,
): boolean | number | string | string[] {
  if (value === 'true') return true;
  if (value === 'false') return false;

  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  if (value.includes(',')) {
    return value.split(',').map((v) => v.trim());
  }

  return value;
}

export class AppConfig {
  // Application Settings
  @Expose({ name: 'NODE_ENV' })
  @IsEnum(Environment)
  @IsOptional()
  environment: Environment = Environment.Development;

  @IsNumber()
  @Min(0)
  @Max(65535)
  @Expose({ name: 'APP_PORT' })
  port: number = 3000;

  @IsOptional()
  @IsString()
  @Matches(/^\//, {
    message: 'APP_GLOBAL_ROUTE_PREFIX must start with /',
  })
  @Expose({ name: 'APP_GLOBAL_ROUTE_PREFIX' })
  globalRoutePrefix: string = '/api';

  @Expose({ name: 'APP_TRUST_PROXY' })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string'
      ? resolveTrustProxy(value)
      : (value as boolean | number | string | string[]),
  )
  trustProxy: boolean | number | string | string[] = false;

  // CORS Settings
  @Expose({ name: 'APP_CORS_ORIGINS' })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string'
      ? resolveCorsOrigin(value)
      : (value as boolean | string[] | string),
  )
  @IsCorsOrigin()
  corsOrigins: boolean | string[] | string = false;

  // Logger Settings
  @Expose({ name: 'APP_LOG_LEVEL' })
  @IsEnum(LogLevel)
  @IsOptional()
  logLevel: LogLevel = LogLevel.warn;

  @Expose({ name: 'APP_LOG_COLLECTOR' })
  @IsEnum(LogCollector)
  @IsOptional()
  logCollector: LogCollector = LogCollector.Console;
}

export function applicationConfig() {
  return validatedConfig(process.env, AppConfig);
}

export default registerAs<AppConfig>('application', () =>
  applicationConfig(),
);
