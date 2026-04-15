import { fetchClient } from '@/lib/api';

interface PresignData {
  uploadUrl: string;
  fileUrl: string;
  objectName: string;
  bucket: string;
  expiresIn: number;
}

interface UploadOptions {
  file: File;
  bucket: 'products' | 'screenshots';
}

interface UploadResult {
  fileUrl: string;
  objectName: string;
}

export async function uploadFileToMinio({ file, bucket }: UploadOptions): Promise<UploadResult> {
  const presignRes = await fetchClient<PresignData>('/upload/presign', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, bucket }),
  });

  const { uploadUrl, fileUrl, objectName } = presignRes.data;

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${uploadRes.status}`);
  }

  return { fileUrl, objectName };
}
