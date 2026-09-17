import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep local development fail-closed against the local API. Production retains
// the explicit production API default and can still be overridden by deploy env.
const BACKEND_URL = process.env.BACKEND_URL || (
  process.env.NODE_ENV === 'production'
    ? 'https://api.bavio.in'
    : 'http://localhost:4000'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NODE_ENV !== 'production' && process.env.BAVIO_MOBILE_REVIEW === 'true' ? '/review' : '',
  distDir: process.env.NODE_ENV !== 'production' && process.env.BAVIO_MOBILE_REVIEW === 'true' ? '.next-mobile-review' : '.next',
  outputFileTracingRoot: path.join(__dirname),
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: [
    'alaya-osteopathic-suppliantly.ngrok-free.dev',
    'localhost:5000',
    'localhost:3001',
  ],
  async redirects() {
    return [
      {
        source: '/sign-up',
        destination: '/signup',
        permanent: true,
      },
      {
        source: '/privacy',
        destination: '/legal/privacy',
        permanent: true,
      },
      {
        source: '/terms',
        destination: '/legal/terms',
        permanent: true,
      },
      {
        source: '/cookie-policy',
        destination: '/legal/cookies',
        permanent: true,
      },
      {
        source: '/refund-policy',
        destination: '/legal/refund-policy',
        permanent: true,
      },
    ];
  },
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
