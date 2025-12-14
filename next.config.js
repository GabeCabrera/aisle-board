/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Force fresh build - updated Dec 2 2024
  // Disable ESLint during build (we'll run it separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during build to speed up deployment
  // IMPORTANT: Run 'npm run typecheck' in CI or locally before pushing!
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable source maps in production to reduce build time and memory usage
  productionBrowserSourceMaps: false,

  // Explicitly enable SWC minification
  swcMinify: true,

  // Standalone output to reduce container size and improve deployment speed
  output: "standalone",

  // Disable powered by header
  poweredByHeader: false,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Enable experimental features for better performance
  experimental: {
    // Improve cold start times and build performance
    optimizePackageImports: [
      "lucide-react", 
      "framer-motion",
      "@mui/material",
      "@mui/icons-material",
      "@mui/lab",
      "date-fns",
      "googleapis",
      "@dnd-kit/core",
      "@dnd-kit/sortable"
    ],
  },
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = withBundleAnalyzer(nextConfig);
