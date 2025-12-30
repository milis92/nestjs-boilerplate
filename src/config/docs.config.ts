import { IsOptional, IsString, Matches } from 'class-validator';
import { registerAs } from '@nestjs/config';
import { Expose } from 'class-transformer';
import validatedConfig from '@/config/utils/validate-config';

export class DocsConfig {
  @Expose({ name: 'DOCS_PATH' })
  @IsString()
  @IsOptional()
  @Matches(/^\//, { message: 'DOCS_PATH must start with /' })
  path: string = '/docs';

  @Expose({ name: 'DOCS_TITLE' })
  @IsString()
  @IsOptional()
  title: string = 'API';

  @Expose({ name: 'DOCS_DESCRIPTION' })
  @IsString()
  @IsOptional()
  description: string = 'API documentation';

  @Expose({ name: 'DOCS_VERSION' })
  @IsString()
  @IsOptional()
  version: string = '1.0';
}

export function docsConfig() {
  return validatedConfig(process.env, DocsConfig);
}

export default registerAs<DocsConfig>('docs', () => docsConfig());
