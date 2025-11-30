/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during build (we'll run it separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable experimental features for better performance
  experimental: {
    // Improve cold start times
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;
