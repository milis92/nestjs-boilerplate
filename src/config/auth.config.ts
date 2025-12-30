import { registerAs } from '@nestjs/config';
import validatedConfig from '@/config/utils/validate-config';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import {
  Expose,
  Transform,
  TransformFnParams,
} from 'class-transformer';

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
}

export function authConfig() {
  return validatedConfig(process.env, AuthConfig);
}

export default registerAs<AuthConfig>('auth', () => authConfig());
