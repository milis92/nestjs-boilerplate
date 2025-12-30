import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import metadata from '@/metadata';
import { apiReference } from '@scalar/nestjs-api-reference';
import { INestApplication } from '@nestjs/common';

type OpenApiOptions = {
  path?: string;
  title?: string;
  description?: string;
  version?: string;
  username?: string;
  password?: string;
};

export default async function setupOpenApi(
  app: INestApplication,
  options: OpenApiOptions = {
    path: 'docs',
    title: 'API',
    description: 'API documentation',
    version: '1.0',
  },
) {
  const config = new DocumentBuilder()
    .setTitle(options.title || 'API')
    .setDescription(options.description || 'API documentation')
    .setVersion(options.version || '1.0')
    .build();

  await SwaggerModule.loadPluginMetadata(metadata);
  const document = SwaggerModule.createDocument(app, config);

  app.use(
    options.path,
    apiReference({
      sources: [
        { content: document, title: 'Api' },
        // Better Auth schema generation endpoint
        { url: '/api/auth/open-api/generate-schema', title: 'Auth' },
      ],
    }),
  );
}
