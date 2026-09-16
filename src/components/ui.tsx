"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentPropsWithRef, SelectHTMLAttributes } from "react";
import { BotaoFlutuante, type AcaoDaTela } from "@/components/ui/botao-flutuante";

export { Dropdown } from "@/components/ui/dropdown";
export type { OpcaoDoDropdown } from "@/components/ui/dropdown";
export { CampoData } from "@/components/ui/campo-data";
export type { AcaoDaTela } from "@/components/ui/botao-flutuante";
export { Checkbox, GrupoDeEscolha, AreaDeTexto } from "@/components/ui/marcacao";
export type { OpcaoDeEscolha } from "@/components/ui/marcacao";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return <button className={`button ${className}`} {...rest} />;
}

export function SecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return <button className={`button secondary ${className}`} {...rest} />;
}

export function DangerButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return <button className={`button danger ${className}`} {...rest} />;
}

// `ComponentPropsWithRef` e nao `InputHTMLAttributes` para aceitar `ref`: em
// React 19 a ref e prop comum de componente de funcao, mas o tipo antigo nao a
// declarava, e quem precisasse da ref caia num erro de tipo sem saida.
export function Input(props: ComponentPropsWithRef<"input">) {
  const { className = "", ...rest } = props;
  return <input className={`input ${className}`} {...rest} />;
}

/**
 * @deprecated Use `Dropdown`. O `<select>` nativo nao aceita descricao por
 * opcao, nao tem busca e muda de aparencia entre navegadores. Mantido apenas
 * enquanto houver uso nao migrado.
 */
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return <select className={`input ${className}`} {...rest} />;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

/**
 * Rótulo + campo, com mensagem de erro opcional.
 *
 * O erro fica **fora** do `<label>` de propósito: `<label>` só aceita conteúdo
 * de frase, e um `<p>` dentro dele é HTML inválido. Por isso o wrapper.
 */
export function Field({
  label,
  erro,
  children,
}: {
  label: string;
  erro?: string;
  children: React.ReactNode;
}) {
  const rotuloECampo = (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );

  if (!erro) return rotuloECampo;

  return (
    <div className="grid gap-2">
      {rotuloECampo}
      <p className="text-sm text-[var(--pmt-color-danger)]" role="alert">
        {erro}
      </p>
    </div>
  );
}

/**
 * Cabeçalho da página.
 *
 * `acoes` é declarada uma vez: no desktop vira botões ao lado do título, no
 * celular vira o botão flutuante sobre a barra inferior (`BotaoFlutuante`).
 */
export function PageHeader({
  title,
  description,
  acoes = [],
  rotuloDasAcoes,
}: {
  title: string;
  description?: string;
  acoes?: AcaoDaTela[];
  /** Rótulo do botão flutuante quando há mais de uma ação. */
  rotuloDasAcoes?: string;
}) {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {acoes.length > 0 && (
          <div className="page-action max-md:hidden">
            {acoes.map((acao) => {
              const Componente = acao.secundaria ? SecondaryButton : Button;
              const conteudo = (
                <>
                  <acao.icone size={18} aria-hidden="true" />
                  {acao.rotulo}
                </>
              );
              return acao.href && !acao.desabilitada ? (
                <Link key={acao.rotulo} href={acao.href} className={acao.secundaria ? "button secondary" : "button"}>
                  {conteudo}
                </Link>
              ) : (
                <Componente key={acao.rotulo} type="button" onClick={acao.onClick} disabled={acao.desabilitada}>
                  {conteudo}
                </Componente>
              );
            })}
          </div>
        )}
      </div>
      <BotaoFlutuante acoes={acoes} rotulo={rotuloDasAcoes} />
    </>
  );
}
