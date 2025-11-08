import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["utfs.io"],
  },
  // Removed the rewrites to stop proxying to localhost:8080
  // All API routes will be handled by Next.js API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
