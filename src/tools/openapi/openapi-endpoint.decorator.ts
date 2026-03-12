import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  type ApiParamOptions,
  ApiResponse,
} from '@nestjs/swagger';

export interface OpenApiEndpointConfig {
  summary: string;
  description?: string;
  status?: HttpStatus;
  type?: Type | [Type];
  params?: ApiParamOptions[];
  errors?: { status: HttpStatus; description: string }[];
}

export function OpenApiEndpoint(
  config: OpenApiEndpointConfig,
): MethodDecorator {
  const {
    summary,
    description,
    status = HttpStatus.OK,
    type,
    params,
    errors,
  } = config;

  const isArray = Array.isArray(type);
  const responseType = isArray ? type[0] : type;

  const decorators: MethodDecorator[] = [
    ApiOperation({ summary, description }),
    ApiResponse({
      status,
      ...(responseType ? { type: responseType, isArray } : {}),
    }),
    ...(params?.map((p) => ApiParam(p)) ?? []),
    ...Object.entries(
      (errors ?? []).reduce<Record<number, string[]>>(
        (grouped, e) => {
          (grouped[e.status] ??= []).push(e.description);
          return grouped;
        },
        {},
      ),
    ).map(([status, descriptions]) =>
      ApiResponse({
        status: Number(status),
        description: descriptions.join('\n\n'),
      }),
    ),
  ];

  return applyDecorators(...decorators);
}
