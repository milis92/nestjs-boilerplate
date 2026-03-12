import { Inject, Injectable, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Request, Response } from 'express';
import docsConfig, { DocsConfig } from '@/config/docs.config';
import metadata from '@/metadata';

@Injectable()
export class OpenApiService {
  private _handler: ((req: Request, res: Response) => void) | null =
    null;

  constructor(
    @Inject(docsConfig.KEY)
    private readonly config: DocsConfig,
  ) {}

  async setup(app: INestApplication): Promise<void> {
    await SwaggerModule.loadPluginMetadata(metadata);

    const swaggerConfig = new DocumentBuilder()
      .setTitle(this.config.title)
      .setDescription(this.config.description)
      .setVersion(this.config.version)
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    this._handler = apiReference({
      sources: [
        { content: document, title: 'Api' },
        {
          url: '/api/auth/open-api/generate-schema',
          title: 'Auth',
        },
      ],
    }) as (req: Request, res: Response) => void;
  }

  get handler(): (req: Request, res: Response) => void {
    if (!this._handler) {
      return (_req: Request, res: Response) => {
        res.status(503).json({
          message: 'API documentation is not yet available',
        });
      };
    }
    return this._handler;
  }
}
