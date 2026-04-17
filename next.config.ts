import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import path from 'path';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true,
  },
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Augmente la limite body pour /api/analyze-cv (PDF + image base64)
  middlewareClientMaxBodySize: '25mb',
};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload warnings when no auth token is set
  silent: true,
  // Disable source map upload (configure later with SENTRY_AUTH_TOKEN)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
