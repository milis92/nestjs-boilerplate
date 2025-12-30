import { Query, Resolver } from '@nestjs/graphql';
import { AuthAllowAnonymous } from '@/infra/auth/auth.decorators';

@AuthAllowAnonymous()
@Resolver()
export class GraphqlResolver {
  @Query(() => String, { description: 'Health check query' })
  health(): string {
    return 'ok';
  }
}