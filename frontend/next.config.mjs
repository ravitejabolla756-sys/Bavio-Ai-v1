import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backend URL: default to production AWS backend, override via env if needed
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.bavio.in';

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  devIndicators: false,
  allowedDevOrigins: [
    'alaya-osteopathic-suppliantly.ngrok-free.dev',
    'localhost:5000',
    'localhost:3001',
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
      {
        source: '/real-estate',
        destination: '/use-cases/real-estate',
      },
      {
        source: '/clinics',
        destination: '/use-cases/healthcare',
      },
      {
        source: '/restaurants',
        destination: '/use-cases/restaurants',
      },
      {
        source: '/security',
        destination: '/legal/security',
      },
    ];
  },
};

export default nextConfig;
