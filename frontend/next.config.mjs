import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backend URL: default to production AWS backend.
// IMPORTANT: Do NOT set BACKEND_URL to localhost in Vercel production environment variables.
// If BACKEND_URL is missing, the production AWS backend (https://api.bavio.in) is used.
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.bavio.in';

// Safety check: warn if BACKEND_URL is pointing to localhost in a non-dev context.
if (
  BACKEND_URL.includes('localhost') ||
  BACKEND_URL.includes('127.0.0.1')
) {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    // This will surface during the Vercel build log, catching misconfiguration early.
    console.error(
      `[BAVIO CONFIG ERROR] BACKEND_URL is set to a localhost address ("${BACKEND_URL}") in a Vercel/production environment. ` +
      `All /api/* requests will fail. Set BACKEND_URL=https://api.bavio.in in Vercel environment variables, or delete the variable to use the default.`
    );
  } else {
    console.warn(`[BAVIO CONFIG] Using local backend: ${BACKEND_URL}`);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  devIndicators: false,
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
