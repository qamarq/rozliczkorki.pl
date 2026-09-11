import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@repo/api", "@repo/auth", "@repo/db"],
  outputFileTracingIncludes: {
    "/": ["./content/blog/**/*"],
    "/blog": ["./content/blog/**/*"],
    "/blog/[slug]": ["./content/blog/**/*"],
    "/sitemap.xml": ["./content/blog/**/*"],
  },
};

export default nextConfig;
