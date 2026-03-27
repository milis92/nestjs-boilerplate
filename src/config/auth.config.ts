import { registerAs } from '@nestjs/config';
import validatedConfig from '@/config/utils/validate-config';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import {
  Expose,
  Transform,
  TransformFnParams,
} from 'class-transformer';
import { AsBoolean } from '@/config/utils/as-boolean.transformer';

export class AuthConfig {
  @Expose({ name: 'AUTH_SECRET' })
  @IsString()
  secret!: string;

  @Expose({ name: 'AUTH_BASE_URL' })
  @IsUrl({ require_tld: false })
  baseUrl!: string;

  @Expose({ name: 'AUTH_TRUSTED_ORIGINS' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string'
      ? value.split(',').map((origin: string) => origin.trim())
      : [],
  )
  trustedOrigins: string[] = [];

  @Expose({ name: 'AUTH_SESSION_EXPIRES_IN' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  sessionExpiresIn: number = 60 * 60 * 24 * 7; // 7 days

  @Expose({ name: 'AUTH_SESSION_UPDATE_AGE' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  sessionUpdateAge: number = 60 * 60 * 24; // 1 day

  @Expose({ name: 'AUTH_DATABASE_HOST' })
  @IsString()
  @IsOptional()
  databaseHost: string = 'localhost';

  @Expose({ name: 'AUTH_DATABASE_PORT' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(65535)
  databasePort: number = 5432;

  @Expose({ name: 'AUTH_DATABASE_DB' })
  @IsString()
  databaseName!: string;

  @Expose({ name: 'AUTH_DATABASE_USER' })
  @IsString()
  databaseUser!: string;

  @Expose({ name: 'AUTH_DATABASE_PASSWORD' })
  @IsString()
  databasePassword!: string;

  @Expose({ name: 'AUTH_DATABASE_SSL' })
  @IsBoolean()
  @IsOptional()
  @AsBoolean()
  databaseSsl: boolean = false;

  @Expose({ name: 'AUTH_DATABASE_SSL_REJECT_UNAUTHORIZED' })
  @IsBoolean()
  @IsOptional()
  @AsBoolean()
  databaseSslRejectUnauthorized: boolean = false;
}

export function authConfig() {
  return validatedConfig(process.env, AuthConfig);
}

export default registerAs<AuthConfig>('auth', () => authConfig());
