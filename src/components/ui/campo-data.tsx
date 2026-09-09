"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { ancorar } from "@/components/ui/ancoragem";
import { cn } from "@/lib/utils";

type Props = {
  /** ISO `AAAA-MM-DD`, ou `AAAA-MM-DDTHH:mm` quando `comHora`. */
  value?: string;
  defaultValue?: string;
  onChange?: (valor: string) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  rotulo?: string;
  /** Limites em ISO. O calendário desabilita o que estiver fora. */
  min?: string;
  max?: string;
  /** Acrescenta a hora — substitui o `datetime-local` nativo. */
  comHora?: boolean;
};

const LARGURA_DE_GAVETA = 640;
const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/**
 * Converte ISO em `dd/mm/aaaa`, sem passar por `new Date()`.
 *
 * `new Date("2026-09-08")` é lido como meia-noite **UTC** e, num fuso a oeste,
 * volta como dia 7 — o campo mostraria um dia a menos que o gravado. Data de
 * calendário não tem hora nem fuso; tratar como texto é o que preserva isso.
 */
function isoParaBr(iso: string): string {
  const [data] = (iso || "").split("T");
  const [ano, mes, dia] = data.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "";
}

function brParaIso(br: string): string | null {
  const casou = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!casou) return null;
  const [, dia, mes, ano] = casou;
  const d = Number(dia), m = Number(mes), a = Number(ano);
  if (m < 1 || m > 12 || d < 1 || a < 1900) return null;
  // Valida o dia contra o mês: 31/02 casa com a máscara e não existe.
  if (d > new Date(a, m, 0).getDate()) return null;
  return `${ano}-${mes}-${dia}`;
}

function mascarar(bruto: string): string {
  const digitos = bruto.replace(/\D/g, "").slice(0, 8);
  const partes = [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)];
  return partes.filter(Boolean).join("/");
}

const hojeIso = () => {
  const agora = new Date();
  const mm = String(agora.getMonth() + 1).padStart(2, "0");
  const dd = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mm}-${dd}`;
};

function useEhGaveta() {
  return React.useSyncExternalStore(
    (aoMudar) => {
      const c = window.matchMedia(`(max-width: ${LARGURA_DE_GAVETA - 1}px)`);
      c.addEventListener("change", aoMudar);
      return () => c.removeEventListener("change", aoMudar);
    },
    () => window.matchMedia(`(max-width: ${LARGURA_DE_GAVETA - 1}px)`).matches,
    () => false,
  );
}

/**
 * Campo de data com máscara e calendário.
 *
 * O `<input type="date">` nativo muda de aparência, de idioma e de ordem dos
 * campos conforme navegador e sistema — no Windows aparece em `mm/dd/aaaa` para
 * quem tem o sistema em inglês, o que numa tela em português é convite a
 * registrar a data errada. Aqui a ordem é sempre `dd/mm/aaaa`.
 *
 * Digitar continua sendo o caminho mais rápido para quem sabe a data; o
 * calendário serve para escolher olhando. O valor emitido é sempre ISO.
 */
export function CampoData({
  value, defaultValue = "", onChange, name, id, disabled = false, required = false,
  className, rotulo, min, max, comHora = false,
}: Props) {
  const ehControlado = value !== undefined;
  const [interno, setInterno] = React.useState(defaultValue);
  const iso = ehControlado ? (value ?? "") : interno;

  // O texto do campo é DERIVADO do valor, e não copiado para um estado com
  // efeito de sincronia. O rascunho existe só enquanto a data digitada está
  // incompleta ("12/0"), quando ainda não há ISO para derivar dela; assim que o
  // valor muda por fora — limpar filtros, carregar um registro —, o rascunho
  // deixa de casar e o campo volta a mostrar o valor de verdade.
  const [rascunho, setRascunho] = React.useState<{ texto: string; de: string } | null>(null);
  const texto = rascunho && rascunho.de === iso ? rascunho.texto : isoParaBr(iso);
  const hora = (iso.split("T")[1] ?? "").slice(0, 5);
  const [aberto, setAberto] = React.useState(false);
  const [caixa, setCaixa] = React.useState<DOMRect | null>(null);
  const [mesVisivel, setMesVisivel] = React.useState(() => (iso || hojeIso()).slice(0, 7));

  const campo = React.useRef<HTMLInputElement | null>(null);
  const painel = React.useRef<HTMLDivElement | null>(null);
  const ehGaveta = useEhGaveta();
  const geradoId = React.useId();
  const idDoCampo = id ?? `data-${geradoId}`;

  const emitir = React.useCallback((novoIso: string, novaHora = hora) => {
    const completo = comHora && novoIso && novaHora ? `${novoIso}T${novaHora}` : novoIso;
    if (!ehControlado) setInterno(completo);
    onChange?.(completo);
  }, [comHora, hora, ehControlado, onChange]);

  function aoDigitar(bruto: string) {
    const mascarado = mascarar(bruto);
    if (mascarado === "") { setRascunho({ texto: "", de: "" }); emitir(""); return; }
    const convertido = brParaIso(mascarado);
    if (convertido) {
      const completo = comHora && hora ? `${convertido}T${hora}` : convertido;
      setRascunho({ texto: mascarado, de: completo });
      emitir(convertido);
      setMesVisivel(convertido.slice(0, 7));
    } else {
      // Data ainda incompleta: guarda o rascunho contra o valor atual.
      setRascunho({ texto: mascarado, de: iso });
    }
  }

  const posicionar = React.useCallback(() => {
    if (campo.current) setCaixa(campo.current.parentElement!.getBoundingClientRect());
  }, []);

  const abrir = React.useCallback(() => {
    if (disabled) return;
    setMesVisivel((iso || hojeIso()).slice(0, 7));
    posicionar();
    setAberto(true);
  }, [disabled, iso, posicionar]);

  React.useEffect(() => {
    if (!aberto || ehGaveta) return;
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
    const fora = (evento: MouseEvent) => {
      const alvo = evento.target as Node;
      if (painel.current?.contains(alvo) || campo.current?.parentElement?.contains(alvo)) return;
      setAberto(false);
    };
    const escapar = (evento: KeyboardEvent) => { if (evento.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", escapar);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", escapar);
    };
  }, [aberto]);

  const [ano, mes] = mesVisivel.split("-").map(Number);
  const primeiroDiaDaSemana = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const celulas: (string | null)[] = [
    ...Array(primeiroDiaDaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) =>
      `${ano}-${String(mes).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`),
  ];

  function mudarMes(passo: number) {
    const d = new Date(ano, mes - 1 + passo, 1);
    setMesVisivel(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function escolher(dia: string) {
    setRascunho(null);
    emitir(dia);
    if (!comHora) setAberto(false);
  }

  const calendario = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2">
        <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold capitalize text-foreground" aria-live="polite">
          {MESES[mes - 1]} {ano}
        </span>
        <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="p-2">
        <div className="grid grid-cols-7 gap-1 pb-1" aria-hidden="true">
          {DIAS.map((d, i) => (
            <span key={i} className="flex h-8 items-center justify-center text-xs font-semibold text-muted-foreground">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Escolha o dia">
          {celulas.map((dia, i) => {
            if (!dia) return <span key={`vazio-${i}`} />;
            const foraDoLimite = (min && dia < min) || (max && dia > max);
            const escolhido = dia === iso.slice(0, 10);
            const ehHoje = dia === hojeIso();
            return (
              <button
                key={dia}
                type="button"
                disabled={Boolean(foraDoLimite)}
                aria-pressed={escolhido}
                onClick={() => escolher(dia)}
                className={cn(
                  "flex h-10 items-center justify-center rounded-lg text-sm transition-colors",
                  "hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent",
                  escolhido && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                  !escolhido && ehHoje && "font-semibold text-primary ring-1 ring-primary/40",
                )}
              >
                {Number(dia.slice(-2))}
              </button>
            );
          })}
        </div>
      </div>

      {comHora && (
        <div className="flex items-center gap-3 border-t border-border/70 px-3 py-2.5">
          <label htmlFor={`${idDoCampo}-hora`} className="text-sm text-muted-foreground">Hora</label>
          <input
            id={`${idDoCampo}-hora`}
            type="time"
            value={hora}
            onChange={(e) => { setRascunho(null); emitir(iso.slice(0, 10), e.target.value); }}
            className="h-11 flex-1 rounded-lg border border-border bg-background px-3 text-base"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border/70 px-3 py-2">
        <button type="button" onClick={() => escolher(hojeIso())}
          className="h-11 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-soft">
          Hoje
        </button>
        <button type="button" onClick={() => { setRascunho(null); emitir("", ""); setAberto(false); }}
          className="h-11 rounded-lg px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
          Limpar
        </button>
      </div>
    </>
  );

  return (
    <div className="relative">
      <input
        ref={campo}
        id={idDoCampo}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={comHora ? "dd/mm/aaaa" : "dd/mm/aaaa"}
        aria-label={rotulo}
        aria-required={required || undefined}
        disabled={disabled}
        value={comHora && hora ? `${texto} ${hora}`.trim() : texto}
        onChange={(e) => aoDigitar(e.target.value)}
        onFocus={() => !ehGaveta && abrir()}
        className={cn(
          "h-11 w-full rounded-lg border border-border bg-background pl-4 pr-12 text-base text-foreground transition-colors",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      />

      <button
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        disabled={disabled}
        aria-label={aberto ? "Fechar calendário" : "Abrir calendário"}
        aria-expanded={aberto}
        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <CalendarDays className="h-4 w-4" />
      </button>

      {name && <input type="hidden" name={name} value={iso} />}

      {aberto && typeof document !== "undefined" && createPortal(
        ehGaveta ? (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/50 animate-fade-entra motion-reduce:animate-none"
              onClick={() => setAberto(false)} aria-hidden="true" />
            <div ref={painel}
              className="relative w-full rounded-t-xl border border-b-0 border-border bg-popover pb-[env(safe-area-inset-bottom)] shadow-elevated animate-gaveta-entra motion-reduce:animate-none">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
                <span className="text-sm font-semibold text-foreground">{rotulo ?? "Escolha a data"}</span>
                <button type="button" onClick={() => setAberto(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </button>
              </div>
              {calendario}
            </div>
          </div>
        ) : (
          <div
            ref={painel}
            style={caixa ? ancorar(caixa, { largura: 300, alturaMaxima: 420 }).estilo : { display: "none" }}
            className="z-[60] overflow-hidden rounded-xl border border-border bg-popover shadow-elevated animate-lista-entra motion-reduce:animate-none"
          >
            {calendario}
          </div>
        ),
        document.body,
      )}
    </div>
  );
}
