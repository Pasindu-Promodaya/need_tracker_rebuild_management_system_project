import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy all /api/* requests to the backend container (internal Docker network)
        source: "/api/:path*",
        destination: "http://backend:8000/api/:path*",
      },
      {
        // Proxy media files (uploads, images) served by Django
        source: "/media/:path*",
        destination: "http://backend:8000/media/:path*",
      },
    ];
  },
};

export default nextConfig;
