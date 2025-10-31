import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure Turbopack root to avoid multiple lockfiles warning
  turbopack: {
    root: __dirname
  }
};

export default nextConfig;
