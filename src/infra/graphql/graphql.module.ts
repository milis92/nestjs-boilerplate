import { Global, Inject, Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import helmet from 'helmet';
import type { Express } from 'express';
import graphqlConfig, {
  GraphqlConfig,
} from '@/config/graphql.config';
import { GraphqlHealthCheckIndicator } from './graphql.health';
import { GraphqlResolver } from '@/infra/graphql/graphql.resolver';
import { ConfigModule } from '@nestjs/config';

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
    ConfigModule.forFeature(graphqlConfig),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      ...graphqlConfig.asProvider(),
      useFactory: (config: GraphqlConfig) => ({
        playground: false,
        graphiql: false,
        debug: config.debug,
        path: config.path,
        introspection: config.introspection,
        autoSchemaFile: true,
        sortSchema: true,
        autoTransformHttpErrors: true,
        installSubscriptionHandlers: true,
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
        context: ({ req, res }: { req: unknown; res: unknown }) => ({
          req,
          res,
        }),
      }),
    }),
  ],
  providers: [GraphqlHealthCheckIndicator, GraphqlResolver],
  exports: [GraphqlHealthCheckIndicator],
})
export class GraphqlModule implements OnModuleInit {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(graphqlConfig.KEY) private readonly config: GraphqlConfig,
  ) {}

  onModuleInit() {
    const app =
      this.httpAdapterHost.httpAdapter.getInstance<Express>();
    // Apollo registers its Express handler in its own onModuleInit, which runs
    // before this one (imported modules initialise before their parent). That
    // means NestModule.configure() — which runs even later, after registerRouter()
    // — is too late: Apollo never calls next(), so any middleware applied via
    // configure() would be skipped entirely.
    //
    // Registering here instead places this Helmet after Apollo in the Express
    // stack. It still wins because res.setHeader() overwrites — the last Helmet
    // to touch Content-Security-Policy before the response is flushed takes
    // effect, and Apollo sets the header before ending the response.
    app.use(
      this.config.path,
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
          directives: {
            imgSrc: [
              `'self'`,
              'data:',
              'apollo-server-landing-page.cdn.apollographql.com',
            ],
            scriptSrc: [`'self'`, `https:`, `'unsafe-inline'`],
            manifestSrc: [
              `'self'`,
              'apollo-server-landing-page.cdn.apollographql.com',
            ],
            frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
          },
        },
      }),
    );
  }
}
