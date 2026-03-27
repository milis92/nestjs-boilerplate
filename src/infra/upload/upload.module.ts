import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import uploadConfig, { UploadConfig } from '@/config/upload.config';

import { UploadHealthCheckIndicator } from './upload.health';

/**
 * Module that configures Multer for file uploads and exposes a disk health check.
 *
 * ### What It Provides
 *
 * - **MulterModule** — globally configured with the default upload destination.
 *   Individual endpoints define their own file type and size limits via interceptor options.
 * - **UploadHealthCheckIndicator** — health check that verifies disk space
 *   at the upload destination is below the configured threshold.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forFeature(uploadConfig),
    MulterModule.registerAsync({
      ...uploadConfig.asProvider(),
      useFactory: (config: UploadConfig) => ({
        dest: config.dest,
      }),
    }),
  ],
  providers: [UploadHealthCheckIndicator],
  exports: [UploadHealthCheckIndicator],
})
export class UploadModule {}
