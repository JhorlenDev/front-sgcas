import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
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
        "itinerant-actions",
        "queues",
        "users",
      ].map((path) => ({
        source: `/api/${path}/`,
        destination: `${apiUrl}/api/${path}/`,
      })),
      ...[
        "itinerant-actions/resumo",
      ].map((path) => ({
        source: `/api/${path}`,
        destination: `${apiUrl}/api/${path}`,
      })),
      {
        source: "/api/itinerant-actions/:id/:action",
        destination: `${apiUrl}/api/itinerant-actions/:id/:action`,
      },
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
