/**
 * Common error response structure from NestJS.
 */
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
