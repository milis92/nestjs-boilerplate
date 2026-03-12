import { HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common';
import { ParseUUIDPipeOptions } from '@nestjs/common/pipes/parse-uuid.pipe';

/**
 * Parameter decorator that extracts and validates a UUID v7 path parameter.
 * Returns 400 Bad Request if the value is not a valid UUID v7.
 *
 * @example
 * @Get(':id')
 * findOne(@UUIDv7Param('id') id: string) { ... }
 */
export const UUIDv7Param = (
  param: string,
  options: Omit<ParseUUIDPipeOptions, 'version'> = {
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  },
) => Param(param, new ParseUUIDPipe({ ...options, version: '7' }));
