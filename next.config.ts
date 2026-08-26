import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const apiUrl = process.env.SGCAS_API_URL ?? "http://localhost:8000";
    return [
      ...[
        "access-requests",
        "cases",
        "citizens",
        "institutional/coordinations",
        "institutional/demands",
        "institutional/units",
        "institutional/services",
        "queues",
        "users",
      ].map((path) => ({
        source: `/api/${path}/`,
        destination: `${apiUrl}/api/${path}/`,
      })),
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
