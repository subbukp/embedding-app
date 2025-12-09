import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 15+ middleware configuration
  experimental: {
    // Enable server components in middleware if needed
    serverComponentsExternalPackages: [],
  },

  // Configure headers for Supabase
  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
