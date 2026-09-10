import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@repo/api", "@repo/auth", "@repo/db"],
};

export default nextConfig;
