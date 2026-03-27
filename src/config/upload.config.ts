import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { registerAs } from '@nestjs/config';
import { Expose } from 'class-transformer';
import validatedConfig from '@/config/utils/validate-config';

export class UploadConfig {
  @Expose({ name: 'UPLOAD_DEST' })
  @IsString()
  @IsOptional()
  dest: string = './uploads';

  @Expose({ name: 'UPLOAD_DISK_THRESHOLD' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  diskThreshold: number = 0.9;
}

export function uploadConfig() {
  return validatedConfig(process.env, UploadConfig);
}

export default registerAs<UploadConfig>('upload', () =>
  uploadConfig(),
);
