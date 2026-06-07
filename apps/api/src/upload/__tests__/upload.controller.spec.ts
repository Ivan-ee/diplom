import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';
import { UploadController } from '../upload.controller';
import { ScreenshotPresignDto } from '../dto/screenshot-presign.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

function guardNames(target: object): string[] {
  const guards = Reflect.getMetadata(GUARDS_METADATA, target);

  return (guards ?? []).map((guard: unknown) =>
    typeof guard === 'function' ? guard.name : String(guard),
  );
}

describe('UploadController', () => {
  it('keeps the general presign endpoint protected by JwtAuthGuard', () => {
    expect(guardNames(UploadController.prototype.presign)).toContain(JwtAuthGuard.name);
  });

  it('does not protect screenshot presign with JwtAuthGuard', () => {
    expect(guardNames(UploadController)).not.toContain(JwtAuthGuard.name);
    expect(guardNames(UploadController.prototype.presignScreenshot)).not.toContain(
      JwtAuthGuard.name,
    );
  });

  it('forces screenshot uploads into the screenshots bucket', () => {
    const uploadService = {
      presignUrl: vi.fn().mockReturnValue({
        uploadUrl: 'https://minio.test/upload',
        fileUrl: 'https://cdn.test/screenshots/cake.png',
        objectName: 'cake.png',
        bucket: 'screenshots',
        expiresIn: 900,
      }),
    };
    const controller = new UploadController(uploadService as never);

    controller.presignScreenshot({ filename: 'cake-screenshot.png' });

    expect(uploadService.presignUrl).toHaveBeenCalledWith({
      filename: 'cake-screenshot.png',
      bucket: 'screenshots',
    });
  });
});

describe('ScreenshotPresignDto', () => {
  it('rejects a caller-supplied bucket', async () => {
    const dto = Object.assign(new ScreenshotPresignDto(), {
      filename: 'cake-screenshot.png',
      bucket: 'products',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((error) => error.property === 'bucket')).toBe(true);
  });
});
