import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UploadService } from './upload.service';
import { PresignDto } from './dto/presign.dto';
import { ScreenshotPresignDto } from './dto/screenshot-presign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth('bakery_token')
  @ApiOperation({
    summary: 'Get a presigned PUT URL for uploading a file to MinIO',
  })
  @ApiResponse({ status: 200, description: 'Presigned PUT URL and object key' })
  @ApiResponse({ status: 400, description: 'Invalid bucket or file parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  presign(@Body() dto: PresignDto) {
    return this.uploadService.presignUrl(dto);
  }

  @Post('screenshots/presign')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({
    summary: 'Get a public presigned PUT URL for a constructor screenshot',
  })
  @ApiResponse({ status: 200, description: 'Presigned screenshot PUT URL and object key' })
  @ApiResponse({ status: 400, description: 'Invalid file parameters' })
  @ApiResponse({ status: 403, description: 'CSRF token validation failed' })
  presignScreenshot(@Body() dto: ScreenshotPresignDto) {
    return this.uploadService.presignUrl({
      filename: dto.filename,
      bucket: 'screenshots',
    });
  }
}
