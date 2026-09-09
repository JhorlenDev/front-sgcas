"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { SecondaryButton } from "@/components/ui";

type Props = {
  pagina: number;
  paginas: number;
  total: number;
  porPagina: number;
  onPagina: (pagina: number) => void;
  /** O que está sendo contado, no plural: "casos", "cidadãos". */
  rotulo: string;
};

const formatar = (n: number) => n.toLocaleString("pt-BR");

/**
 * Navegação entre páginas de uma listagem.
 *
 * Mostra a faixa exibida e o total real ("26-50 de 220.065"), que é justamente
 * o que faltava quando a API cortava em 100 e a tela apresentava o corte como
 * se fosse o tamanho da rede.
 *
 * Some quando há uma página só: controle de página numa lista que cabe inteira
 * na tela é ruído.
 */
export function Paginacao({ pagina, paginas, total, porPagina, onPagina, rotulo }: Props) {
  if (total === 0 || paginas <= 1) return null;

  const primeiro = (pagina - 1) * porPagina + 1;
  const ultimo = Math.min(pagina * porPagina, total);

  return (
    <nav
      aria-label={`Paginação de ${rotulo}`}
      className="mt-5 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-muted-foreground" aria-live="polite">
        <strong className="font-semibold text-foreground">
          {formatar(primeiro)}–{formatar(ultimo)}
        </strong>{" "}
        de {formatar(total)} {rotulo}
      </p>

      <div className="flex items-center gap-2">
        <SecondaryButton
          type="button"
          className="h-10 min-w-11 px-3"
          onClick={() => onPagina(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </SecondaryButton>

        <span className="min-w-24 text-center text-xs text-muted-foreground">
          Página {formatar(pagina)} de {formatar(paginas)}
        </span>

        <SecondaryButton
          type="button"
          className="h-10 min-w-11 px-3"
          onClick={() => onPagina(pagina + 1)}
          disabled={pagina >= paginas}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </SecondaryButton>
      </div>
    </nav>
  );
}
