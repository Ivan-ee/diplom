import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PresignDto {
  @ApiProperty({ example: 'cake-screenshot.png' })
  @IsString()
  filename!: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  contentType!: string;

  @ApiPropertyOptional({
    example: 'screenshots',
    default: 'screenshots',
    description: 'MinIO bucket name',
  })
  @IsOptional()
  @IsString()
  bucket?: string;
}
