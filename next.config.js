/** @type {import('next').NextConfig} */
const dotenv = require('dotenv');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

dotenv.config();

const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // swcMinify: true,
  images: {
    unoptimized: true, // Reduces build-time memory usage
  },
  experimental: {
    // Force SWC to be used even with Babel config present
    forceSwcTransforms: true,
    // missingSuspenseWithCSRBailout: false,
    webpackMemoryOptimizations: true,
    serverSourceMaps: false,
    optimizeCss: true,
    optimizeServerReact: true,
  },
  webpack: (config, { isServer, dev }) => {
    // Only apply optimizations for production builds
    if (!dev) {
      // Reduce chunk size
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000
      };

      // Disable source maps in production
      if (!isServer) {
        config.optimization.minimize = true;
        config.devtool = false;
      }
    }
    
    return config;
  },
  env: {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DATABASE: process.env.DB_DATABASE,
    DB_PORT: process.env.DB_PORT,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,
    AWS_BUCKET: process.env.AWS_BUCKET,
    AWS_URL: process.env.AWS_URL,
    AWS_USE_PATH_STYLE_ENDPOINT: process.env.AWS_USE_PATH_STYLE_ENDPOINT,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_SECURE: process.env.EMAIL_SECURE,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NSANO_SMS_ENDPOINT: process.env.NSANO_SMS_ENDPOINT,
    NSANO_SMS_KEY: process.env.NSANO_SMS_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    // REDIS_URL: process.env.REDIS_URL,
    DEV_MODE: process.env.DEV_MODE,
    DEV_MODE_SKIP_PING: process.env.DEV_MODE_SKIP_PING,
    NEXT_PUBLIC_VERSION_PAGE_PASSWORD: process.env.NEXT_PUBLIC_VERSION_PAGE_PASSWORD,
    
  }
};

// Use the simpler version if bundle analyzer is not needed for regular builds
module.exports = process.env.ANALYZE === 'true' 
  ? withBundleAnalyzer(nextConfig) 
  : nextConfig;
