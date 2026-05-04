import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy all /api/* requests to the backend
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
      {
        // Proxy media files (uploads, images) served by Django
        source: "/media/:path*",
        destination: "http://localhost:8000/media/:path*",
      },
    ];
  },
  experimental: {},
};

export default nextConfig;
