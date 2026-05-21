import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // OneDrive ломает папку .next — сборка в node_modules/.cache
  distDir: 'node_modules/.cache/vaychat-next',
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
