"use client";

import { Card } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/*
 * Skeletons por TIPO DE BLOCO, não um por página.
 *
 * A regra que os governa: cada um espelha o grid, as alturas e o espaçamento do
 * bloco real que substitui. Skeleton genérico entrega a mesma tela branca com
 * mais passos — e, pior, quando o conteúdo real entra com outra altura, a
 * página pula na cara de quem está lendo.
 *
 * Todos partem do mesmo `Skeleton` de `ui/skeleton.tsx` (o shimmer), para o
 * ritmo da animação ser um só no sistema inteiro.
 */

/** Linha de texto. `w` controla a largura, para o bloco não virar um paredão. */
export function LinhaFalsa({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4", className)} />;
}

/**
 * Cartão de indicador — o `.stat` do painel e dos painéis de fila/recepção.
 *
 * `min-h-40` no painel vem de `.dashboard-stats .stat`; nas demais telas o
 * cartão é mais baixo, daí o `alto` opcional.
 */
export function IndicadorFalso({ alto = false }: { alto?: boolean }) {
  return (
    <Card className={cn("stat", alto && "min-h-40")}>
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-8 w-16" />
      <Skeleton className="mt-3 h-3 w-36" />
    </Card>
  );
}

export function FaixaDeIndicadores({
  quantidade = 3,
  colunas = "md:grid-cols-3",
  alto = false,
}: {
  quantidade?: number;
  colunas?: string;
  alto?: boolean;
}) {
  return (
    <div className={cn("grid gap-4", colunas)}>
      {Array.from({ length: quantidade }, (_, i) => (
        <IndicadorFalso key={i} alto={alto} />
      ))}
    </div>
  );
}

/*
 * Cartão de resumo do topo das telas.
 *
 * O sistema tem TRÊS medidas do mesmo cartão, cada uma escrita à mão numa tela
 * (`ResumoCard` em /casos e /admin, `MiniStat` em /fila e /recepção). Não dá
 * para atender as três com um skeleton só sem a página pular quando o número
 * chega: são 116, 104 e 100px de altura.
 *
 * Reproduzi a diferença aqui em vez de unificar os cartões reais — unificá-los
 * é mexer em cinco telas por um motivo que não é este, e vira outro commit.
 */
type MedidaDeResumo = "grande" | "media" | "compacta";

const MEDIDAS: Record<
  MedidaDeResumo,
  { cartao: string; valor: string; nota: string; marca: string }
> = {
  // !p-4  · valor text-3xl mt-2  · nota mt-1     — /casos, /fila
  grande: { cartao: "!p-4", valor: "mt-2 h-9 w-20", nota: "mt-1 h-5 w-40", marca: "h-10 w-10" },
  // !p-4  · valor text-2xl mt-1.5 · nota mt-0.5  — /admin
  media: { cartao: "!p-4", valor: "mt-1.5 h-8 w-16", nota: "mt-0.5 h-4 w-36", marca: "h-9 w-9" },
  // !p-3.5 · valor text-2xl mt-1.5 · nota mt-0.5 — /recepção
  compacta: { cartao: "!p-3.5", valor: "mt-1.5 h-8 w-16", nota: "mt-0.5 h-4 w-36", marca: "h-9 w-9" },
};

export function CartaoDeResumoFalso({
  variante = "grande",
  marca = "circulo",
  blocos = 0,
}: {
  variante?: MedidaDeResumo;
  /** Círculo com ícone (/fila, /admin, /recepção) ou pastilha de texto (/casos). */
  marca?: "circulo" | "pastilha";
  /** Blocos empilhados abaixo do número — as próximas ações de /ações itinerantes. */
  blocos?: number;
}) {
  const m = MEDIDAS[variante];
  return (
    <Card className={m.cartao}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className={m.valor} />
          <Skeleton className={m.nota} />
        </div>
        {marca === "circulo" ? (
          <Skeleton className={cn("shrink-0 rounded-full", m.marca)} />
        ) : (
          <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
        )}
      </div>
      {blocos > 0 && (
        <div className="mt-3 space-y-2">
          {Array.from({ length: blocos }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
    </Card>
  );
}

export function FaixaDeResumosFalsa({
  quantidade = 3,
  colunas = "md:grid-cols-3",
  espaco = "gap-4",
  variante = "grande",
  marca = "circulo",
  blocos = 0,
}: {
  quantidade?: number;
  colunas?: string;
  espaco?: string;
  variante?: MedidaDeResumo;
  marca?: "circulo" | "pastilha";
  blocos?: number;
}) {
  return (
    <div className={cn("grid", espaco, colunas)}>
      {Array.from({ length: quantidade }, (_, i) => (
        <CartaoDeResumoFalso key={i} variante={variante} marca={marca} blocos={blocos} />
      ))}
    </div>
  );
}

/**
 * Uma linha de lista.
 *
 * As três listas do sistema são o mesmo bloco com recheios diferentes: a fila
 * tem a pastilha da senha à esquerda, os acompanhamentos têm etiquetas em cima
 * e duas linhas de relato. `linhas` e `comEtiquetas` cobrem as duas sem virar
 * dois componentes que saem de sincronia.
 */
export function ItemDeListaFalso({
  comPastilha = false,
  comEtiquetas = false,
  linhas = 2,
}: {
  comPastilha?: boolean;
  comEtiquetas?: boolean;
  linhas?: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {comPastilha && <Skeleton className="h-11 w-14 shrink-0" />}
          <div className="min-w-0 flex-1">
            {comEtiquetas && (
              <div className="mb-2 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            )}
            {Array.from({ length: linhas }, (_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  i === 0 ? "h-4 w-2/5" : "mt-2 h-3",
                  i === 1 && "w-3/5",
                  i > 1 && "w-4/5",
                )}
              />
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ListaFalsa({
  itens = 5,
  comPastilha = false,
  comEtiquetas = false,
  linhas = 2,
  /**
   * A fila renderiza as linhas direto dentro do cartão, encostadas. O skeleton
   * copia isso porque o alvo aqui é não pular, e não corrigir o espaçamento.
   */
  espaco = "gap-3",
}: {
  itens?: number;
  comPastilha?: boolean;
  comEtiquetas?: boolean;
  linhas?: number;
  espaco?: string;
}) {
  return (
    <div className={cn("grid", espaco)}>
      {Array.from({ length: itens }, (_, i) => (
        <ItemDeListaFalso
          key={i}
          comPastilha={comPastilha}
          comEtiquetas={comEtiquetas}
          linhas={linhas}
        />
      ))}
    </div>
  );
}

/** Cartão de caso — os "Últimos atendimentos" da fila, em grade de duas colunas. */
export function CartaoDeCasoFalso() {
  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-1.5 h-5 w-full" />
      <div className="mt-3 flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
    </article>
  );
}

/** Linhas separadas por divisória — o `.line-row` das listas do painel. */
export function LinhasDivididasFalsas({ itens = 6 }: { itens?: number }) {
  return (
    <>
      {Array.from({ length: itens }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 border-t border-border py-4 first:border-t-0 first:pt-0"
        >
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/5" />
        </div>
      ))}
    </>
  );
}

/** Tabela com o mesmo número de colunas da real, para as larguras baterem. */
export function TabelaFalsa({
  colunas = 4,
  linhas = 8,
  subtituloNaPrimeira = false,
}: {
  colunas?: number;
  linhas?: number;
  /** A primeira coluna tem nome + linha secundária embaixo (unidades, serviços). */
  subtituloNaPrimeira?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: colunas }, (_, i) => (
              <th key={i}><Skeleton className="h-3 w-20" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: linhas }, (_, l) => (
            <tr key={l}>
              {Array.from({ length: colunas }, (_, c) => (
                <td key={c}>
                  <Skeleton className={cn("h-4", c === 0 ? "w-40" : "w-24")} />
                  {c === 0 && subtituloNaPrimeira && <Skeleton className="mt-1.5 h-3 w-28" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Barra de filtros — mesma grade e a altura `h-11` dos campos reais. */
export function FiltrosFalsos({ campos = 4 }: { campos?: number }) {
  return (
    <div className="mb-5 grid gap-4 border-b border-border/70 pb-5 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: campos }, (_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-11 w-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Seção da ficha do cidadão — espelha `Secao` + `Campo` de `/cidadaos/[id]`.
 *
 * As alturas seguem os elementos reais: `dt` é `text-xs` (16px) e `dd` é
 * `text-sm leading-6` (24px). Errar aqui é o que faz a ficha inteira escorregar
 * quando os dados chegam, e a ficha tem dez seções para escorregar juntas.
 */
export function SecaoDeFichaFalsa({
  campos = 6,
  larguraDoTitulo = "w-40",
  children,
}: {
  campos?: number;
  larguraDoTitulo?: string;
  /** Substitui a grade de campos — para as seções que são lista ou tabela. */
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className={cn("h-6", larguraDoTitulo)} />
      </div>
      {children ?? (
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {Array.from({ length: campos }, (_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-1 h-6 w-32" />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/** Lista de itens separados por divisória — acompanhamentos e histórico da ficha. */
export function ListaDaFichaFalsa({ itens = 4 }: { itens?: number }) {
  return (
    <ul className="grid gap-3">
      {Array.from({ length: itens }, (_, i) => (
        <li key={i} className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-1 h-4 w-3/4" />
        </li>
      ))}
    </ul>
  );
}

/** Cabeçalho de página: título grande + descrição. */
export function CabecalhoFalso() {
  return (
    <div className="mb-5">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
    </div>
  );
}

/**
 * Conteúdo genérico enquanto a sessão não resolveu.
 *
 * Só aqui o skeleton é genérico, e por um motivo: neste instante nem o
 * `AppShell` sabe em que tela a pessoa está — o roteador já sabe, mas o
 * conteúdo ainda não pode ser montado sem o papel do operador.
 */
export function ConteudoFalso() {
  return (
    <div aria-hidden="true">
      <CabecalhoFalso />
      <FaixaDeIndicadores quantidade={3} />
      <div style={{ height: 16 }} />
      <Card>
        <Skeleton className="h-5 w-48" />
        <div className="mt-4">
          <LinhasDivididasFalsas itens={5} />
        </div>
      </Card>
    </div>
  );
}

/**
 * Cartão de lista/tabela com o cabeçalho já no lugar.
 *
 * Existe porque o cabeçalho (título + contador) some junto com o conteúdo em
 * várias telas, e devolvê-lo em cada página seria a mesma marcação copiada
 * seis vezes.
 */
export function CartaoFalso({
  children,
  comContador = true,
}: {
  children: React.ReactNode;
  comContador?: boolean;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-40" />
        {comContador && <Skeleton className="h-6 w-20 rounded-full" />}
      </div>
      {children}
    </Card>
  );
}
