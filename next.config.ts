import type { NextConfig } from "next";

/**
 * Origens extras liberadas no servidor de desenvolvimento.
 *
 * Em desenvolvimento o Next recusa requisição de origem diferente daquela em
 * que subiu — os arquivos de `/_next/*` voltam 403. Isso protege o dev server
 * de ser lido por outro site, e é o que quebra quando a aplicação é exposta por
 * um túnel (Cloudflare, ngrok) para alguém testar de fora: a página carrega e
 * nenhum script vem junto.
 *
 * Não vale para `next start` — em produção não existe esse bloqueio.
 *
 *   NEXT_DEV_ORIGINS="*.trycloudflare.com,meu-tunel.exemplo" npm run dev
 */
const origensDeDesenvolvimento = (process.env.NEXT_DEV_ORIGINS ?? "")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  ...(origensDeDesenvolvimento.length > 0
    ? { allowedDevOrigins: origensDeDesenvolvimento }
    : {}),
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
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
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
