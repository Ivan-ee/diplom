import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { PresignDto } from './dto/presign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Upload')
@ApiBearerAuth()
@ApiCookieAuth('bakery_token')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presign')
  @ApiOperation({
    summary: 'Get a presigned PUT URL for uploading a file to MinIO',
  })
  @ApiResponse({ status: 200, description: 'Presigned PUT URL and object key' })
  @ApiResponse({ status: 400, description: 'Invalid bucket or file parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  presign(@Body() dto: PresignDto) {
    return this.uploadService.presignUrl(dto);
  }
}
