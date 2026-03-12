import {
  Controller,
  Get,
  Req,
  Res,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { AuthAllowAnonymous } from '@/infra/auth/auth.decorators';
import { OpenApiService } from '@/tools/openapi/openapi.service';

@ApiExcludeController(true)
@Controller('docs')
export class OpenApiController {
  constructor(private readonly openApiService: OpenApiService) {}

  @Get()
  @SkipThrottle()
  @AuthAllowAnonymous()
  @Version(VERSION_NEUTRAL)
  serve(@Req() req: Request, @Res() res: Response): void {
    return this.openApiService.handler(req, res);
  }
}
