import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export const ALLOWED_BUCKETS = ['screenshots', 'products', 'models'] as const;

export class PresignDto {
  @ApiProperty({ example: 'cake-screenshot.png' })
  @IsString()
  filename!: string;

  @ApiPropertyOptional({
    example: 'screenshots',
    default: 'screenshots',
    description: 'MinIO bucket name',
    enum: ALLOWED_BUCKETS,
  })
  @IsOptional()
  @IsIn(ALLOWED_BUCKETS)
  bucket?: string;
}
