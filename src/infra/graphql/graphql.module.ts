import { Global, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import graphqlConfig, {
  GraphqlConfig,
} from '@/config/graphql.config';
import { GraphqlHealthCheckIndicator } from './graphql.health';
import { GraphqlResolver } from '@/infra/graphql/graphql.resolver';

/**
 * Module that configures GraphQL API using Apollo Server with NestJS integration.
 *
 * ### Purpose
 *
 * This module sets up a GraphQL endpoint powered by Apollo Server, enabling
 * type-safe API queries and mutations with automatic schema generation
 * from TypeScript decorators.
 *
 * ### Context
 *
 * The request and response objects are passed to the GraphQL context,
 * making them available to resolvers for authentication, session handling,
 * and other request-specific operations.
 */
@Global()
@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      ...graphqlConfig.asProvider(),
      useFactory: (config: GraphqlConfig) => ({
        playground: config.playground,
        graphiql: true,
        debug: config.debug,
        path: config.path,
        introspection: config.introspection,
        autoSchemaFile: true,
        sortSchema: true,
        autoTransformHttpErrors: true,
        installSubscriptionHandlers: true,
        context: ({ req, res }: { req: any; res: any }) => ({ req, res }),
      }),
    }),
  ],
  providers: [GraphqlHealthCheckIndicator, GraphqlResolver],
  exports: [GraphqlHealthCheckIndicator],
})
export class GraphqlModule {}
