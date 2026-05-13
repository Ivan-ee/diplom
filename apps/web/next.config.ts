import type { NextConfig } from 'next';

function minioRemotePatterns(): NextConfig['images'] {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    { protocol: 'http', hostname: 'localhost', port: '9000' },
    { protocol: 'http', hostname: 'minio', port: '9000' },
  ];

  const publicUrl = process.env.NEXT_PUBLIC_MINIO_URL;
  if (publicUrl) {
    try {
      const url = new URL(publicUrl);
      patterns.push({
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
      });
    } catch { /* ignore invalid URL */ }
  }

  return {
    dangerouslyAllowLocalIP: true,
    remotePatterns: patterns,
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === 'true',
  };
}

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/:path*`,
      },
      {
        source: '/constructor',
        destination: '/cake-constructor',
      },
      {
        source: '/admin/constructor',
        destination: '/admin/cake-constructor',
      },
    ];
  },
  images: minioRemotePatterns(),
};

export default nextConfig;
