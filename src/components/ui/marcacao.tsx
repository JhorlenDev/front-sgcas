"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Caixa de marcação e escolha única.
 *
 * O `<input type=checkbox>` do navegador tem cerca de 13x13 pixels e não aceita
 * estilo: fica pequeno demais para o dedo (o mínimo confortável é 44px de alvo)
 * e destoa do resto dos campos. Aqui o input nativo continua existindo — é ele
 * que carrega o valor no `FormData`, recebe o foco e responde ao teclado —, só
 * que invisível, com a caixa desenhada por cima. Assim nada de acessibilidade
 * se perde no caminho.
 */

type PropsDaCaixa = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  /** Texto ao lado. Aceita marcação para quando houver link no meio. */
  children?: React.ReactNode;
  /** Segunda linha, menor, para a explicação. */
  descricao?: React.ReactNode;
  /** Meio-marcado: usado quando um grupo está parcialmente selecionado. */
  indeterminado?: boolean;
};

export const Checkbox = React.forwardRef<HTMLInputElement, PropsDaCaixa>(
  ({ className, children, descricao, indeterminado = false, disabled, ...props }, refExterna) => {
    const interna = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(refExterna, () => interna.current as HTMLInputElement);

    React.useEffect(() => {
      // `indeterminate` não existe como atributo em HTML: só como propriedade
      // do elemento, então tem de ser escrita no DOM.
      if (interna.current) interna.current.indeterminate = indeterminado;
    }, [indeterminado]);

    return (
      <label
        className={cn(
          "group flex min-h-11 cursor-pointer items-start gap-3 py-1.5",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center pt-0.5">
          <input
            ref={interna}
            type="checkbox"
            disabled={disabled}
            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            {...props}
          />
          {/*
            A visibilidade do ícone vem da COR DO TEXTO da caixa, não de uma
            classe no próprio ícone: `peer-*` do Tailwind só alcança irmãos, e o
            ícone é filho desta caixa. Transparente quando desmarcado, cor do
            contraste quando marcado — e o `currentColor` do ícone acompanha.
          */}
          <span
            aria-hidden="true"
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded border border-input bg-elevated text-transparent transition-colors",
              "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
              "peer-indeterminate:border-primary peer-indeterminate:bg-primary peer-indeterminate:text-primary-foreground",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            )}
          >
            {indeterminado
              ? <Minus className="h-3.5 w-3.5" strokeWidth={3} />
              : <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
        </span>

        {(children || descricao) && (
          <span className="min-w-0 flex-1 pt-px">
            {children && <span className="block text-sm leading-6 text-foreground">{children}</span>}
            {descricao && (
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{descricao}</span>
            )}
          </span>
        )}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";

export type OpcaoDeEscolha = {
  value: string;
  label: string;
  descricao?: string;
  disabled?: boolean;
};

type PropsDoGrupo = {
  name: string;
  opcoes: OpcaoDeEscolha[];
  value?: string;
  defaultValue?: string;
  onChange?: (valor: string) => void;
  /** Rótulo do grupo inteiro — vira o `aria-label` do `radiogroup`. */
  rotulo: string;
  /** Lado a lado quando couber, em vez de empilhado. */
  emLinha?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Escolha única entre poucas opções.
 *
 * Rádio quando as opções são duas ou três e vale mostrar todas de uma vez;
 * acima disso, `Dropdown` ocupa menos e ganha busca.
 */
export function GrupoDeEscolha({
  name, opcoes, value, defaultValue, onChange, rotulo, emLinha = false, disabled, className,
}: PropsDoGrupo) {
  const ehControlado = value !== undefined;
  const [interno, setInterno] = React.useState(defaultValue ?? "");
  const escolhido = ehControlado ? value : interno;

  function escolher(valor: string) {
    if (!ehControlado) setInterno(valor);
    onChange?.(valor);
  }

  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className={cn("flex gap-2", emLinha ? "flex-row flex-wrap" : "flex-col", className)}
    >
      {opcoes.map((opcao) => {
        const marcado = opcao.value === escolhido;
        return (
          <label
            key={opcao.value}
            className={cn(
              "group flex min-h-11 flex-1 cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition-colors",
              marcado ? "border-primary bg-primary-soft" : "border-input bg-elevated hover:border-primary/40",
              (disabled || opcao.disabled) && "cursor-not-allowed opacity-50",
            )}
          >
            <span className="relative flex h-5 w-5 shrink-0 items-center justify-center pt-0.5">
              <input
                type="radio"
                name={name}
                value={opcao.value}
                checked={marcado}
                disabled={disabled || opcao.disabled}
                onChange={() => escolher(opcao.value)}
                className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                  marcado ? "border-primary" : "border-input bg-elevated",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                )}
              >
                {marcado && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-6 text-foreground">{opcao.label}</span>
              {opcao.descricao && (
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                  {opcao.descricao}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/**
 * Área de texto com a mesma caixa dos demais campos.
 *
 * `resize-y` de propósito: arrastar na horizontal quebra o alinhamento da
 * coluna do formulário, e não há motivo para permitir.
 */
export const AreaDeTexto = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "rolagem-sutil min-h-28 w-full resize-y rounded-md border border-input bg-elevated px-3 py-2 text-sm text-foreground transition-colors",
      "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
AreaDeTexto.displayName = "AreaDeTexto";
