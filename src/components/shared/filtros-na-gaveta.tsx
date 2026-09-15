"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button, SecondaryButton } from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Filtros de uma listagem: soltos na grade no desktop, numa gaveta no celular.
 *
 * Empilhados num celular, cinco filtros ocupavam a primeira tela inteira — a
 * pessoa rolava uma tela de campos antes de ver o primeiro resultado. Aqui eles
 * cabem num botão que diz quantos estão ligados, e a gaveta mostra o total que
 * o filtro produz antes de fechar.
 *
 * Os `children` vão para os dois lugares. No desktop, o `md:contents` faz os
 * campos participarem da grade do pai como se o invólucro não existisse. No
 * celular eles só existem com a gaveta aberta (o Radix desmonta o conteúdo
 * fechado), então não há dois campos vivos ao mesmo tempo.
 */
export function FiltrosNaGaveta({
  ativos,
  resultado,
  onLimpar,
  children,
}: {
  /** Quantos filtros estão ligados — vira o selo do botão. */
  ativos: number;
  /** Texto do botão que fecha a gaveta, ex.: "Ver 1.204 casos". */
  resultado: string;
  onLimpar: () => void;
  children: React.ReactNode;
}) {
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <SecondaryButton type="button" className="w-full justify-between md:hidden" onClick={() => setAberta(true)} aria-haspopup="dialog">
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={18} aria-hidden="true" />
          Filtros e ordem
        </span>
        {ativos > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
            {ativos}
            <span className="sr-only"> {ativos === 1 ? "filtro ligado" : "filtros ligados"}</span>
          </span>
        )}
      </SecondaryButton>

      <div className="hidden md:contents">{children}</div>

      <Dialog open={aberta} onOpenChange={setAberta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtros e ordem</DialogTitle>
            <DialogDescription>O resultado atualiza enquanto você escolhe.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">{children}</div>
          <DialogFooter>
            {ativos > 0 && (
              <SecondaryButton type="button" onClick={onLimpar}>
                Limpar
              </SecondaryButton>
            )}
            <Button type="button" onClick={() => setAberta(false)}>
              {resultado}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
