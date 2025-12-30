import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { registerAs } from '@nestjs/config';
import validatedConfig from '@/config/utils/validate-config';
import { AsBoolean } from '@/config/utils/as-boolean.transformer';
import { Expose } from 'class-transformer';

export class DatabaseConfig {
  @Expose({ name: 'POSTGRES_HOST' })
  @IsString()
  @IsOptional()
  host: string = 'localhost';

  @Expose({ name: 'POSTGRES_PORT' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(65535)
  port: number = 5432;

  @Expose({ name: 'POSTGRES_DB' })
  @IsString()
  database!: string;

  @Expose({ name: 'POSTGRES_USER' })
  @IsString()
  user!: string;

  @Expose({ name: 'POSTGRES_PASSWORD' })
  @IsString()
  password!: string;

  @Expose({ name: 'POSTGRES_SSL' })
  @IsBoolean()
  @IsOptional()
  @AsBoolean()
  ssl: boolean = false;

  @Expose({ name: 'POSTGRES_SSL_REJECT_UNAUTHORIZED' })
  @IsBoolean()
  @IsOptional()
  @AsBoolean()
  rejectUnauthorized: boolean = false;
}

export function databaseConfig() {
  return validatedConfig(process.env, DatabaseConfig);
}

export default registerAs<DatabaseConfig>('database', () =>
  databaseConfig(),
);
