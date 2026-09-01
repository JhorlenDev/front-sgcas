"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock3, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginWithTefeCidadao } from "@/lib/api";
import { defaultRouteForRole, useAuth } from "@/lib/auth";

const errors: Record<string, { title: string; text: string }> = {
  "sem-acesso": {
    title: "Acesso ainda não liberado",
    text: "Sua conta entrou pelo Tefé Cidadão, mas ainda não tem perfil aprovado no SGCAS.",
  },
  "estado-invalido": {
    title: "Sessão expirada",
    text: "Comece o acesso novamente para proteger sua sessão.",
  },
  "sem-codigo": {
    title: "Retorno incompleto",
    text: "O Tefé Cidadão não devolveu o código de acesso. Tente entrar outra vez.",
  },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [entering, setEntering] = useState(false);

  const loginError = useMemo(() => {
    const error = params.get("erro");
    return error ? errors[error] : undefined;
  }, [params]);

  useEffect(() => {
    if (!loading && user) {
      router.replace(defaultRouteForRole(user.papel));
    }
  }, [loading, router, user]);

  function handleLogin() {
    setEntering(true);
    loginWithTefeCidadao();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-dark px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="absolute inset-0 bg-gradient-page-hero" />
          <div className="absolute inset-x-12 bottom-24 h-px bg-white/10" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/12 ring-1 ring-white/15">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight">SGCAS</p>
              <p className="text-xs text-white/65">Sistema de Gestão de Casos</p>
            </div>
          </div>

          <div className="relative max-w-xl space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pmt-color-fg-on-dark-muted)]">
              SGCAS · Tefé
            </p>
            <h1 className="text-4xl leading-[1.08] text-[var(--pmt-color-fg-on-dark)] xl:text-5xl">
              Gestão simples para cada atendimento.
            </h1>
            <p className="max-w-md text-sm leading-6 text-white/72">
              Recepção, fila e acompanhamentos em um fluxo único, seguro e organizado por perfil.
            </p>
          </div>

          <div className="relative grid max-w-2xl grid-cols-3 gap-2.5">
            {[
              ["Entrar com SSO", LockKeyhole],
              ["Aprovação do admin", CheckCircle2],
              ["Recepção e fila", Clock3],
            ].map(([label, Icon]) => (
              <div key={label as string} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-4 w-4 text-[var(--pmt-color-fg-on-dark)]" />
                </span>
                <p className="text-xs font-semibold text-white/88">{label as string}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[430px]">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold leading-tight">SGCAS</p>
                <p className="text-xs text-muted-foreground">Sistema de Gestão de Casos</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-6 shadow-[0_24px_60px_-38px_rgba(14,77,157,0.34)] sm:p-8">
              <div className="mb-8 space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-3xl leading-tight text-foreground">Entrar no SGCAS</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Use sua conta institucional do Tefé Cidadão para acessar o sistema.
                  </p>
                </div>
              </div>

              {loginError && (
                <div className="mb-6 rounded-lg border border-[var(--pmt-color-warning)] bg-[var(--pmt-color-warning-soft)] px-4 py-3 text-sm text-[var(--pmt-color-warning-soft-fg)]">
                  <p className="font-medium">{loginError.title}</p>
                  <p className="mt-1 leading-5 text-[var(--pmt-color-warning-soft-fg)]">{loginError.text}</p>
                </div>
              )}

              <Button
                type="button"
                className="h-12 w-full justify-between rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-[0_16px_32px_-22px_rgba(14,77,157,0.9)] hover:bg-primary-hover"
                onClick={handleLogin}
                disabled={entering || loading}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white">
                    <Image src="/tefe-cidadao-mark.svg" alt="" width={20} height={20} className="object-contain" />
                  </span>
                  {entering ? "Abrindo Tefé Cidadão..." : "Entrar com Tefé Cidadão"}
                </span>
                {entering ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </Button>

              <div className="mt-6 rounded-lg bg-secondary px-4 py-3 text-xs leading-5 text-muted-foreground">
                O SGCAS não usa senha própria. Quem ainda não tem perfil entra na fila de aprovação do administrador.
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">SEDECTI · Prefeitura de Tefé</p>
          </div>
        </section>
      </div>
    </main>
  );
}
