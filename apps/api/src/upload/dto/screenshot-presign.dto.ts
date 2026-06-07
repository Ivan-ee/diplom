import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ScreenshotPresignDto {
  @ApiProperty({ example: 'cake-screenshot.png' })
  @IsString()
  filename!: string;
}
