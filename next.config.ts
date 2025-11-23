import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  /* Core Settings */
  reactStrictMode: true,

  /* Performance */
  experimental: {
    // Enable Server Actions
    serverActions: {
      allowedOrigins: ["localhost:3000"],
      bodySizeLimit: "50mb", // Match Multer limit
    },
  },

  /* TypeScript */
  typescript: {
    // Enforces type checking during builds
    ignoreBuildErrors: false,
  },

  /* Headers for API Security */
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },

  /* Environment Variables (public) */
  env: {
    NEXT_PUBLIC_APP_NAME: "Gemini File Search",
    NEXT_PUBLIC_APP_VERSION: "2.0.0",
  },

  /* Image Optimization (if needed in future) */
  images: {
    remotePatterns: [],
  },
};

export default withNextIntl(nextConfig);
