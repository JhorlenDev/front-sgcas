import type { Metadata } from "next";

// Fontes do PMT 2026, auto-hospedadas. O sistema proibe CDN de terceiro:
// e dependencia externa em servico essencial, e e dado de acesso do cidadao
// saindo do pais.
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";

import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "SGCAS",
  description: "Sistema de Gestao de Casos da Assistencia Social",
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
