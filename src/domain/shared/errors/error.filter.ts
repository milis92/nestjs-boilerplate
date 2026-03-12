import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { Response } from 'express';
import { ServiceError } from './service.error';

/**
 * Exception filter that catches {@link ServiceError} and maps error codes to HTTP status codes.
 * For GraphQL contexts, re-throws the error to let the GraphQL error handler format it.
 */
@Catch(ServiceError)
export class ServiceErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ServiceErrorFilter.name);

  catch(exception: ServiceError, host: ArgumentsHost) {
    // Log errors based on severity
    if (exception.code === 'DATABASE_ERROR') {
      this.logger.error(
        `Database error: ${exception.message}`,
        exception.cause instanceof Error
          ? exception.cause.stack
          : String(exception.cause),
      );
    } else if (exception.code === 'CONSISTENCY_ERROR') {
      this.logger.error(`Consistency error: ${exception.message}`);
    } else if (exception.code === 'NOT_FOUND') {
      this.logger.debug(`Not found: ${exception.message}`);
    } else if (exception.code === 'INVALID_REFERENCE') {
      this.logger.warn(
        `Invalid reference attempt: ${exception.message}`,
      );
    } else {
      this.logger.warn(
        `Service error [${exception.code}]: ${exception.message}`,
      );
    }
    const contextType = host.getType<GqlContextType>();

    // For GraphQL context, re-throw the error to let NestJS GraphQL handle it
    if (contextType === 'graphql') {
      throw exception;
    }

    // HTTP context handling
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: HttpStatus;
    switch (exception.code) {
      case 'NOT_FOUND':
        status = HttpStatus.NOT_FOUND;
        break;
      case 'CONFLICT':
        status = HttpStatus.CONFLICT;
        break;
      case 'INVALID_REFERENCE':
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        break;
      case 'CONSISTENCY_ERROR':
      case 'DATABASE_ERROR':
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        break;
      // TypeScript exhaustiveness check — compiler error if a new ServiceErrorCode is added without a case
      default: {
        const _exhaustive: never = exception.code;
        this.logger.error(
          `Unmapped service error code: ${String(_exhaustive)}`,
        );
        status = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.code,
    });
  }
}
