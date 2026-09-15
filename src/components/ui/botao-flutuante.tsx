"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Plus, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Ação principal de uma tela, descrita como dado.
 *
 * A mesma declaração vira botão no cabeçalho do desktop e botão flutuante no
 * celular (ver `PageHeader`). Escrever as duas formas à mão em cada página era
 * pedir para uma delas ficar para trás quando o rótulo ou a regra mudassem.
 */
export type AcaoDaTela = {
  rotulo: string;
  icone: LucideIcon;
  onClick?: () => void;
  href?: string;
  desabilitada?: boolean;
  /** Botão cinza no desktop. A ação principal é a que fica sem isto. */
  secundaria?: boolean;
  /** Segunda linha na lista do celular, quando há mais de uma ação. */
  descricao?: string;
};

const POSICAO =
  // Acima da barra inferior (4rem) com 1rem de respiro, e da barra de gestos.
  "fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 md:hidden";

const FORMATO = cn(
  "inline-flex h-14 items-center gap-2 rounded-full bg-primary pl-5 pr-6 text-sm font-bold text-primary-foreground shadow-elevated",
  "transition-transform active:scale-95 motion-reduce:transition-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-50",
);

/**
 * Botão flutuante do celular (FAB).
 *
 * No topo da página, a ação some assim que a pessoa rola a lista; aqui ela fica
 * sempre ao alcance do polegar. Com uma ação, o toque executa. Com mais de uma,
 * abre uma gaveta para escolher — dois FABs empilhados disputam o mesmo canto e
 * ninguém sabe qual é o principal.
 *
 * O `data-fab` é o que o `main` do `AppShell` procura (`has-[[data-fab]]`) para
 * reservar a altura do botão no fim da página — sem isso ele cobriria o último
 * item da lista.
 */
export function BotaoFlutuante({ acoes, rotulo = "Ações" }: { acoes: AcaoDaTela[]; rotulo?: string }) {
  const [escolhendo, setEscolhendo] = useState(false);
  if (acoes.length === 0) return null;

  const unica = acoes.length === 1 ? acoes[0] : null;

  return (
    <>
      {unica ? (
        unica.href && !unica.desabilitada ? (
          <Link data-fab href={unica.href} className={cn(POSICAO, FORMATO)}>
            <unica.icone className="h-5 w-5" aria-hidden="true" />
            {unica.rotulo}
          </Link>
        ) : (
          <button data-fab type="button" className={cn(POSICAO, FORMATO)} onClick={unica.onClick} disabled={unica.desabilitada}>
            <unica.icone className="h-5 w-5" aria-hidden="true" />
            {unica.rotulo}
          </button>
        )
      ) : (
        <button data-fab type="button" className={cn(POSICAO, FORMATO)} onClick={() => setEscolhendo(true)} aria-haspopup="dialog">
          <Plus className="h-5 w-5" aria-hidden="true" />
          {rotulo}
        </button>
      )}

      {!unica && (
        <Dialog open={escolhendo} onOpenChange={setEscolhendo}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{rotulo}</DialogTitle>
              <DialogDescription>Escolha o que deseja fazer.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {acoes.map((acao) => {
                const conteudo = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <acao.icone className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-foreground">{acao.rotulo}</span>
                      {acao.descricao && <span className="block text-sm text-muted-foreground">{acao.descricao}</span>}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </>
                );
                const classes = cn(
                  "flex min-h-14 items-center gap-3 rounded-lg border border-border bg-elevated px-3 py-2 text-left transition-colors hover:bg-secondary",
                  "disabled:pointer-events-none disabled:opacity-50",
                );
                return acao.href && !acao.desabilitada ? (
                  <Link key={acao.rotulo} href={acao.href} className={classes} onClick={() => setEscolhendo(false)}>
                    {conteudo}
                  </Link>
                ) : (
                  <button
                    key={acao.rotulo}
                    type="button"
                    className={classes}
                    disabled={acao.desabilitada}
                    onClick={() => {
                      setEscolhendo(false);
                      acao.onClick?.();
                    }}
                  >
                    {conteudo}
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
