import { Injectable } from '@nestjs/common';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { graphql } from 'graphql/graphql';

/**
 * Health check indicator for the GraphQL module.
 *
 * Verifies that the GraphQL schema is properly compiled and available.
 */
@Injectable()
export class GraphqlHealthCheckIndicator {
  constructor(private readonly schemaHost: GraphQLSchemaHost) {}

  /**
   * Checks if the GraphQL schema is healthy by executing a simple introspection query.
   *
   * The check verifies that the schema is properly compiled and can execute queries.
   *
   * @returns `true` if the GraphQL schema is healthy, `false` if the operation fails
   */
  async isHealthy(): Promise<boolean> {
    const schema = this.schemaHost.schema;

    return await graphql({
      schema,
      source: '{ __typename }',
    })
      .catch(() => false)
      .then((result) => {
        if (typeof result === 'boolean') return result;
        if (result.errors?.length) return false;
        if (!result.data?.__typename) return false;
        return true;
      });
  }
}
