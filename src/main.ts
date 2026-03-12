import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@/config/app.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { configure } from '@/configure';

export { configure } from '@/configure';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    {
      // Buffer logs until the Pino logger is ready, ensuring no logs are lost
      // during application startup
      bufferLogs: true,
    },
  );

  const config = app.get(ConfigService);
  const appConfig = config.get<AppConfig>('application')!;

  await configure(app, appConfig);

  await app.listen(appConfig.port, '0.0.0.0');
  return app;
}

bootstrap()
  .then(async (app: INestApplication) => {
    const url = await app.getUrl();
    console.log(`Server listening on ${url.toString()}`);
  })
  .catch((err) => {
    console.error(err);
  });
