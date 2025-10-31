import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack to this project root to avoid the multiple lockfiles issue
  turbopack: {
    root: __dirname
  }
};

export default nextConfig;
