import type { CSSProperties } from "react";

/** Respiro entre o campo e o painel, e do painel até a borda da janela. */
const FOLGA = 6;
const MARGEM_DA_JANELA = 12;

/**
 * Altura mínima que vale a pena abrir para baixo.
 *
 * Abaixo disso o painel abre para cima, se houver mais espaço lá. Sem esse
 * limite, um campo perto do rodapé abre um painel de poucos pixels — ou, pior,
 * inteiramente fora da tela: o painel existe no DOM, a pessoa clica e nada
 * acontece, porque o alvo está abaixo da área visível.
 */
const ALTURA_MINIMA = 220;

type Ancoragem = {
  estilo: CSSProperties;
  /** `true` quando o painel abriu acima do campo. */
  paraCima: boolean;
};

/**
 * Posiciona um painel flutuante colado a um campo.
 *
 * O painel é `position: fixed` para escapar de ancestrais com `overflow` — mas
 * fixo também significa que ele não é empurrado por nada: cabe a este cálculo
 * mantê-lo dentro da janela, em cima ou embaixo, e limitar a altura ao espaço
 * que sobrou.
 */
export function ancorar(
  campo: DOMRect,
  { largura, alturaMaxima = 320 }: { largura?: number; alturaMaxima?: number } = {},
): Ancoragem {
  const abaixo = window.innerHeight - campo.bottom - MARGEM_DA_JANELA - FOLGA;
  const acima = campo.top - MARGEM_DA_JANELA - FOLGA;
  const paraCima = abaixo < Math.min(ALTURA_MINIMA, alturaMaxima) && acima > abaixo;

  const disponivel = Math.max(paraCima ? acima : abaixo, 140);
  const larguraFinal = largura ?? campo.width;

  // Não deixa vazar pela direita quando o painel é mais largo que o campo.
  const esquerda = Math.min(
    Math.max(campo.left, MARGEM_DA_JANELA),
    Math.max(window.innerWidth - larguraFinal - MARGEM_DA_JANELA, MARGEM_DA_JANELA),
  );

  return {
    paraCima,
    estilo: {
      position: "fixed",
      left: esquerda,
      width: larguraFinal,
      maxHeight: Math.min(alturaMaxima, disponivel),
      ...(paraCima
        ? { bottom: window.innerHeight - campo.top + FOLGA }
        : { top: campo.bottom + FOLGA }),
    },
  };
}
