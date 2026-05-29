import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // Security: Prevent exposing Next.js version in headers
  poweredByHeader: false,
  // Enable strict mode to help catch bugs during development
  reactStrictMode: true,
  // Enable compression of response bodies
  compress: true,
  // Disable browser source maps in production
  productionBrowserSourceMaps: false,
};

export default nextConfig;




