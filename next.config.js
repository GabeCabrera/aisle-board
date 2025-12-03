/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force fresh build - updated Dec 2 2024
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
