export type ServiceErrorCode =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'DATABASE_ERROR'
  | 'INVALID_REFERENCE'
  | 'CONSISTENCY_ERROR';

/**
 * Domain-layer error with a typed error code.
 * Thrown by services and mapped to HTTP/GraphQL errors by {@link ServiceErrorFilter}.
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: ServiceErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  /** Entity isn't found — maps to 404. */
  static notFound(entity: string, id: string): ServiceError {
    return new ServiceError(
      `${entity} with id '${id}' not found`,
      'NOT_FOUND',
    );
  }

  /** Referenced entity doesn't belong to the current user — maps to 422. */
  static invalidReference(entity: string, id: string): ServiceError {
    return new ServiceError(
      `${entity} with id '${id}' does not belong to the current user`,
      'INVALID_REFERENCE',
    );
  }

  /** Business rule or unique constraint violation — maps to 409. */
  static conflict(message: string): ServiceError {
    return new ServiceError(message, 'CONFLICT');
  }

  /** Unexpected database failure — maps to 500. Preserves the original cause for logging. */
  static database(operation: string, cause: unknown): ServiceError {
    return new ServiceError(
      `Database error during ${operation}`,
      'DATABASE_ERROR',
      cause,
    );
  }

  /** Write succeeded but re-fetch returned nothing — maps to 500. Indicates a data consistency issue. */
  static consistency(
    operation: string,
    entityId: string,
  ): ServiceError {
    return new ServiceError(
      `Consistency error: ${operation} succeeded but entity ${entityId} could not be fetched`,
      'CONSISTENCY_ERROR',
    );
  }
}
