import type { Metadata, Viewport } from "next";

// Fontes do PMT 2026, auto-hospedadas. O sistema proibe CDN de terceiro:
// e dependencia externa em servico essencial, e e dado de acesso do cidadao
// saindo do pais.
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";

import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "SGCAS",
  description: "Sistema de Gestão de Casos da Assistência Social",
};

// `viewport-fit=cover` deixa a tela ocupar a área do notch e da barra de
// gestos; sem ele, `env(safe-area-inset-*)` vale zero e a barra inferior e o
// botão flutuante não sabem quanto recuar. `themeColor` pinta a barra do
// navegador com o branco do cabeçalho, para a moldura parecer de app.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Primeiro filho do body, por exigencia do sistema: quem navega por
            teclado pula o menu e cai direto no conteudo. */}
        <a className="pmt-skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
