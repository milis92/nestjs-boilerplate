import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { registerAs } from '@nestjs/config';
import { Expose } from 'class-transformer';
import validatedConfig from '@/config/utils/validate-config';
import { AsBoolean } from '@/config/utils/as-boolean.transformer';

export class GraphqlConfig {
  @Expose({ name: 'GQL_PLAYGROUND' })
  @IsBoolean()
  @IsOptional()
  @AsBoolean()
  playground: boolean = false;

  @Expose({ name: 'GQL_DEBUG' })
  @IsBoolean()
  @IsOptional()
  @AsBoolean()
  debug: boolean = false;

  @Expose({ name: 'GQL_PATH' })
  @IsString()
  @IsOptional()
  path: string = '/graphql';

  @Expose({ name: 'GQL_INTROSPECTION' })
  @IsBoolean()
  @IsOptional()
  @AsBoolean()
  introspection: boolean = false;
}

export function graphqlConfig() {
  return validatedConfig(process.env, GraphqlConfig);
}

export default registerAs<GraphqlConfig>('graphql', () =>
  graphqlConfig(),
);
