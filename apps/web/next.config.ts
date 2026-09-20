import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID:
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? "",
  },
  transpilePackages: ["@repo/api", "@repo/auth", "@repo/db", "@repo/shared"],
  async redirects() {
    return [
      {
        source: "/.well-known/change-password",
        destination: "/dashboard#settings/security",
        permanent: false,
      },
    ];
  },
  outputFileTracingIncludes: {
    "/": ["./content/blog/**/*"],
    "/blog": ["./content/blog/**/*"],
    "/blog/[slug]": ["./content/blog/**/*"],
    "/sitemap.xml": ["./content/blog/**/*"],
  },
};

export default nextConfig;
