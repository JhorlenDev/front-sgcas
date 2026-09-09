"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { ancorar } from "@/components/ui/ancoragem";
import { cn } from "@/lib/utils";

export type OpcaoDoDropdown = {
  value: string;
  label: string;
  /**
   * Segunda linha, para desambiguar rótulos parecidos.
   *
   * Aceita `null` porque é o que a API devolve em campo opcional — obrigar cada
   * chamada a converter só espalharia `?? undefined` pelas telas.
   */
  hint?: string | null;
  disabled?: boolean;
};

type Props = {
  opcoes: OpcaoDoDropdown[];
  /** Controlado. Sem ele, o componente guarda a própria seleção. */
  value?: string;
  defaultValue?: string;
  onChange?: (valor: string) => void;
  /** Renderiza um input oculto com este nome, para formulários lidos por `FormData`. */
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  /** Rótulo acessível quando não há `<label>` ligado ao campo. */
  rotulo?: string;
  /** Força ou desliga o campo de busca. Por padrão ele aparece acima de 7 opções. */
  buscavel?: boolean;
};

/**
 * Acima disto, a lista ganha campo de busca.
 *
 * Sete é o ponto em que a lista deixa de ser lida de uma vez e passa a ser
 * varrida: unidade, serviço e coordenação de um município estouram isso com
 * folga, e rolar procurando um nome é pior do que digitar três letras.
 */
const LIMITE_PARA_BUSCA = 7;

/** Abaixo desta largura a lista vira gaveta, como os diálogos. */
const LARGURA_DE_GAVETA = 640;

const semAcento = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function useEhGaveta() {
  return React.useSyncExternalStore(
    (aoMudar) => {
      const consulta = window.matchMedia(`(max-width: ${LARGURA_DE_GAVETA - 1}px)`);
      consulta.addEventListener("change", aoMudar);
      return () => consulta.removeEventListener("change", aoMudar);
    },
    () => window.matchMedia(`(max-width: ${LARGURA_DE_GAVETA - 1}px)`).matches,
    () => false,
  );
}

/**
 * Dropdown de seleção única.
 *
 * Substitui o `<select>` nativo, que não aceita descrição por opção, não
 * permite busca e é praticamente impossível de estilizar de forma consistente
 * entre navegadores.
 *
 * O que ele preserva do nativo, de propósito: teclado completo (setas, Home,
 * End, Enter, Esc, digitar para pular), papéis ARIA de combobox e listbox, e o
 * envio por `name` dentro de um `<form>` — este último por um input oculto, já
 * que vários formulários do sistema são lidos com `new FormData(...)`.
 */
export function Dropdown({
  opcoes,
  value,
  defaultValue = "",
  onChange,
  name,
  placeholder = "Selecione",
  disabled = false,
  required = false,
  id,
  className,
  rotulo,
  buscavel,
}: Props) {
  const ehControlado = value !== undefined;
  const [valorInterno, setValorInterno] = React.useState(defaultValue);
  const valor = ehControlado ? value : valorInterno;

  const [aberto, setAberto] = React.useState(false);
  const [busca, setBusca] = React.useState("");
  const [emFoco, setEmFoco] = React.useState(0);
  const [caixa, setCaixa] = React.useState<DOMRect | null>(null);

  const gatilho = React.useRef<HTMLButtonElement | null>(null);
  const painel = React.useRef<HTMLDivElement | null>(null);
  const campoDeBusca = React.useRef<HTMLInputElement | null>(null);
  const digitado = React.useRef({ texto: "", quando: 0 });

  const ehGaveta = useEhGaveta();
  const geradoId = React.useId();
  const idDoCampo = id ?? `dropdown-${geradoId}`;
  const idDaLista = `${idDoCampo}-lista`;

  const mostraBusca = buscavel ?? opcoes.length > LIMITE_PARA_BUSCA;

  const filtradas = React.useMemo(() => {
    if (!mostraBusca || !busca.trim()) return opcoes;
    const termo = semAcento(busca.trim());
    return opcoes.filter(
      (o) => semAcento(o.label).includes(termo) || semAcento(o.hint ?? "").includes(termo),
    );
  }, [opcoes, busca, mostraBusca]);

  const selecionada = opcoes.find((o) => o.value === valor);

  const posicionar = React.useCallback(() => {
    if (gatilho.current) setCaixa(gatilho.current.getBoundingClientRect());
  }, []);

  const abrir = React.useCallback(() => {
    if (disabled) return;
    posicionar();
    setBusca("");
    const atual = opcoes.findIndex((o) => o.value === valor);
    setEmFoco(atual >= 0 ? atual : 0);
    setAberto(true);
  }, [disabled, opcoes, posicionar, valor]);

  const fechar = React.useCallback((devolverFoco = true) => {
    setAberto(false);
    setBusca("");
    if (devolverFoco) gatilho.current?.focus();
  }, []);

  const escolher = React.useCallback((opcao: OpcaoDoDropdown) => {
    if (opcao.disabled) return;
    if (!ehControlado) setValorInterno(opcao.value);
    onChange?.(opcao.value);
    fechar();
  }, [ehControlado, onChange, fechar]);

  // Reposiciona enquanto aberto: a lista é fixa na viewport para escapar de
  // qualquer ancestral com `overflow`, e por isso precisa acompanhar rolagem e
  // redimensionamento.
  React.useEffect(() => {
    if (!aberto || ehGaveta) return;
    posicionar();
    const acompanhar = () => posicionar();
    window.addEventListener("scroll", acompanhar, true);
    window.addEventListener("resize", acompanhar);
    return () => {
      window.removeEventListener("scroll", acompanhar, true);
      window.removeEventListener("resize", acompanhar);
    };
  }, [aberto, ehGaveta, posicionar]);

  React.useEffect(() => {
    if (!aberto) return;
    const foraDaqui = (evento: MouseEvent) => {
      const alvo = evento.target as Node;
      if (painel.current?.contains(alvo) || gatilho.current?.contains(alvo)) return;
      fechar(false);
    };
    document.addEventListener("mousedown", foraDaqui);
    return () => document.removeEventListener("mousedown", foraDaqui);
  }, [aberto, fechar]);

  // O foco vai para a busca no desktop. Na gaveta não: abriria o teclado do
  // celular por cima da lista que a pessoa acabou de mandar abrir.
  React.useEffect(() => {
    if (aberto && mostraBusca && !ehGaveta) campoDeBusca.current?.focus();
  }, [aberto, mostraBusca, ehGaveta]);

  React.useEffect(() => {
    if (!aberto) return;
    painel.current
      ?.querySelector(`[data-indice="${emFoco}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [emFoco, aberto]);

  function andar(passo: number) {
    if (filtradas.length === 0) return;
    setEmFoco((atual) => {
      let proximo = atual;
      for (let i = 0; i < filtradas.length; i += 1) {
        proximo = (proximo + passo + filtradas.length) % filtradas.length;
        if (!filtradas[proximo]?.disabled) return proximo;
      }
      return atual;
    });
  }

  function aoTeclar(evento: React.KeyboardEvent) {
    if (!aberto) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(evento.key)) {
        evento.preventDefault();
        abrir();
      }
      return;
    }

    switch (evento.key) {
      case "ArrowDown": evento.preventDefault(); andar(1); break;
      case "ArrowUp": evento.preventDefault(); andar(-1); break;
      case "Home": evento.preventDefault(); setEmFoco(0); break;
      case "End": evento.preventDefault(); setEmFoco(filtradas.length - 1); break;
      case "Escape": evento.preventDefault(); fechar(); break;
      case "Tab": fechar(false); break;
      case "Enter":
        evento.preventDefault();
        if (filtradas[emFoco]) escolher(filtradas[emFoco]);
        break;
      default:
        // Digitar para pular, como no `<select>` nativo. Só quando não há campo
        // de busca — com ele, as teclas pertencem ao campo.
        if (!mostraBusca && evento.key.length === 1) {
          const agora = Date.now();
          const texto = agora - digitado.current.quando < 800
            ? digitado.current.texto + evento.key
            : evento.key;
          digitado.current = { texto, quando: agora };
          const achado = filtradas.findIndex((o) => semAcento(o.label).startsWith(semAcento(texto)));
          if (achado >= 0) setEmFoco(achado);
        }
    }
  }

  const lista = (
    <>
      {mostraBusca && (
        <div className="relative border-b border-border/70 p-2">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={campoDeBusca}
            type="text"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setEmFoco(0); }}
            onKeyDown={aoTeclar}
            placeholder="Buscar…"
            aria-label="Buscar nas opções"
            aria-controls={idDaLista}
            // 16px evita o zoom automático do iOS ao focar o campo.
            className="h-11 w-full rounded-lg border border-transparent bg-secondary pl-10 pr-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      )}

      <ul
        id={idDaLista}
        role="listbox"
        aria-label={rotulo ?? placeholder}
        className={cn("overflow-y-auto p-1.5", ehGaveta ? "max-h-[55dvh]" : "max-h-72")}
      >
        {filtradas.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nada encontrado para “{busca}”.
          </li>
        )}

        {filtradas.map((opcao, indice) => {
          const escolhida = opcao.value === valor;
          return (
            <li key={opcao.value || `vazio-${indice}`}>
              <button
                type="button"
                role="option"
                id={`${idDoCampo}-op-${indice}`}
                data-indice={indice}
                aria-selected={escolhida}
                disabled={opcao.disabled}
                onClick={() => escolher(opcao)}
                onMouseEnter={() => setEmFoco(indice)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  "min-h-11 disabled:cursor-not-allowed disabled:opacity-50",
                  indice === emFoco && "bg-primary-soft",
                  escolhida && "text-primary",
                )}
              >
                <Check
                  className={cn("mt-0.5 h-4 w-4 shrink-0", escolhida ? "opacity-100" : "opacity-0")}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-sm", escolhida && "font-semibold")}>
                    {opcao.label}
                  </span>
                  {opcao.hint && (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {opcao.hint}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        id={idDoCampo}
        role="combobox"
        aria-expanded={aberto}
        aria-controls={idDaLista}
        aria-haspopup="listbox"
        aria-required={required || undefined}
        aria-label={rotulo}
        aria-activedescendant={aberto ? `${idDoCampo}-op-${emFoco}` : undefined}
        disabled={disabled}
        onClick={() => (aberto ? fechar() : abrir())}
        onKeyDown={aoTeclar}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-4 text-left text-base transition-colors",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          aberto && "border-primary ring-2 ring-primary/20",
          className,
        )}
      >
        <span className={cn("truncate", selecionada ? "text-foreground" : "text-muted-foreground")}>
          {selecionada?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", aberto && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {name && <input type="hidden" name={name} value={valor} />}

      {/* Sem flag de "montado": `aberto` nasce falso, então o portal nunca é
          alcançado durante a renderização no servidor. */}
      {aberto && typeof document !== "undefined" && createPortal(
        ehGaveta ? (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <div
              className="absolute inset-0 bg-black/50 animate-fade-entra motion-reduce:animate-none"
              onClick={() => fechar(false)}
              aria-hidden="true"
            />
            <div
              ref={painel}
              className="relative flex max-h-[80dvh] w-full flex-col rounded-t-xl border border-b-0 border-border bg-popover pb-[env(safe-area-inset-bottom)] shadow-elevated animate-gaveta-entra motion-reduce:animate-none"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
                <span className="text-sm font-semibold text-foreground">{rotulo ?? placeholder}</span>
                <button
                  type="button"
                  onClick={() => fechar()}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </button>
              </div>
              {lista}
            </div>
          </div>
        ) : (
          <div
            ref={painel}
            style={caixa ? ancorar(caixa, { alturaMaxima: 360 }).estilo : { display: "none" }}
            className="z-[60] flex flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-elevated animate-lista-entra motion-reduce:animate-none"
          >
            {lista}
          </div>
        ),
        document.body,
      )}
    </>
  );
}
