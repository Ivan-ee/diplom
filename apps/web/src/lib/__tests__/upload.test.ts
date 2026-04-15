import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetchClient before importing the module under test
vi.mock('@/lib/api', () => ({
  fetchClient: vi.fn(),
}));

import { uploadFileToMinio } from '../upload';
import { fetchClient } from '@/lib/api';

const mockFetchClient = vi.mocked(fetchClient);

describe('uploadFileToMinio', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  it('calls presign endpoint then PUTs file to MinIO and returns fileUrl and objectName', async () => {
    const uploadUrl = 'https://minio.example.com/screenshots/cake.png?sig=abc';
    const fileUrl = 'https://cdn.example.com/screenshots/cake.png';
    const objectName = 'screenshots/cake-123.png';

    mockFetchClient.mockResolvedValueOnce({
      success: true,
      data: {
        uploadUrl,
        fileUrl,
        objectName,
        bucket: 'screenshots',
        expiresIn: 3600,
      },
    });

    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    const file = new File(['pixel'], 'cake-screenshot-123.png', { type: 'image/png' });
    const result = await uploadFileToMinio({ file, bucket: 'screenshots' });

    // Verify presign call
    expect(mockFetchClient).toHaveBeenCalledOnce();
    expect(mockFetchClient).toHaveBeenCalledWith('/upload/presign', {
      method: 'POST',
      body: JSON.stringify({ filename: 'cake-screenshot-123.png', bucket: 'screenshots' }),
    });

    // Verify PUT to MinIO
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': 'image/png' },
    });

    // Verify return value
    expect(result).toEqual({ fileUrl, objectName });
  });

  it('throws when the presign endpoint returns an error', async () => {
    mockFetchClient.mockRejectedValueOnce(new Error('Unauthorized'));

    const file = new File(['pixel'], 'cake.png', { type: 'image/png' });

    await expect(uploadFileToMinio({ file, bucket: 'screenshots' })).rejects.toThrow('Unauthorized');

    // PUT should never be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('throws when the PUT to MinIO returns a non-ok status', async () => {
    mockFetchClient.mockResolvedValueOnce({
      success: true,
      data: {
        uploadUrl: 'https://minio.example.com/upload',
        fileUrl: 'https://cdn.example.com/file.png',
        objectName: 'screenshots/file.png',
        bucket: 'screenshots',
        expiresIn: 3600,
      },
    });

    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

    const file = new File(['pixel'], 'cake.png', { type: 'image/png' });

    await expect(uploadFileToMinio({ file, bucket: 'screenshots' })).rejects.toThrow(
      'Upload failed: 403',
    );
  });
});
