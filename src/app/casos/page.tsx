"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, CheckCircle2, ClipboardList, MapPin, Stethoscope } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Paginacao } from "@/components/shared/paginacao";
import { Badge, Button, CampoData, Card, Dropdown, EmptyState, Field, Input, PageHeader, SecondaryButton } from "@/components/ui";
import { api, comQuery, paginadoVazio } from "@/lib/api";
import type { Caso, Paginado, ResumoDeCasos } from "@/types/sgcas";

const POR_PAGINA = 25;

const SITUACOES = [
  { value: "", label: "Todas as situações" },
  { value: "EM_TRIAGEM", label: "Em triagem" },
  { value: "EM_ATENDIMENTO", label: "Em atendimento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "ENCAMINHADO", label: "Encaminhado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const PRIORIDADES = [
  { value: "", label: "Todas as prioridades" },
  { value: "URGENTE", label: "Urgente" },
  { value: "ALTA", label: "Alta" },
  { value: "NORMAL", label: "Normal" },
  { value: "BAIXA", label: "Baixa" },
];

const ORDENACOES = [
  { value: "-aberto_em", label: "Mais recentes primeiro" },
  { value: "aberto_em", label: "Mais antigos primeiro" },
  { value: "-atualizado_em", label: "Mexidos por último" },
  { value: "prioridade", label: "Prioridade" },
];

const DESFECHOS = [
  { value: "CONCLUIDO", label: "Concluído", hint: "O atendimento terminou aqui." },
  { value: "ENCAMINHADO", label: "Encaminhado", hint: "Segue em outra unidade ou órgão." },
];

const FILTROS_VAZIOS = { situacao: "", prioridade: "", busca: "", de: "", ate: "", ordenar: "-aberto_em" };

export default function CasosPage() {
  const [pagina, setPagina] = useState<Paginado<Caso> | null>(null);
  const [resumo, setResumo] = useState<ResumoDeCasos | null>(null);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [numero, setNumero] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const temporizadorDaBusca = useRef<number | undefined>(undefined);
  const [casoSelecionado, setCasoSelecionado] = useState<Caso | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [conclusao, setConclusao] = useState<{ situacao: FormDataEntryValue | null; relato: FormDataEntryValue | null } | null>(null);

  const carregar = useCallback(async (pedida: number, aplicados: typeof FILTROS_VAZIOS) => {
    setCarregando(true);
    const params = { ...aplicados, page: pedida, limit: POR_PAGINA };
    // Lista e contadores saem na mesma leva e com os mesmos filtros. Buscar em
    // momentos diferentes deixaria o número do topo descrevendo um recorte que
    // não é mais o da lista de baixo.
    const [lista, contagem] = await Promise.all([
      api<Paginado<Caso>>(comQuery("/cases/", params)).catch(() => paginadoVazio<Caso>(POR_PAGINA)),
      api<ResumoDeCasos>(comQuery("/cases/resumo", aplicados)).catch(() => null),
    ]);
    setPagina(lista);
    setResumo(contagem);
    setCarregando(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregar(numero, filtros);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [carregar, numero, filtros]);

  function aplicarFiltro(campo: keyof typeof FILTROS_VAZIOS, valor: string) {
    // Volta para a primeira página: manter a página 7 depois de trocar o filtro
    // costuma cair além do fim do novo resultado e mostrar uma lista vazia que
    // parece "nada encontrado".
    setNumero(1);
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  }

  const casos = pagina?.itens ?? [];
  const temFiltro = useMemo(
    () => Object.entries(filtros).some(([campo, valor]) => valor && campo !== "ordenar"),
    [filtros],
  );

  function prepararConclusao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!casoSelecionado) return;

    const form = new FormData(event.currentTarget);
    setConclusao({
      situacao: form.get("situacao"),
      relato: form.get("relato"),
    });
    setConfirmOpen(true);
  }

  async function concluir() {
    if (!casoSelecionado || !conclusao) return;
    setSalvando(true);
    try {
      await api(`/cases/${casoSelecionado.id}/concluir`, {
        method: "POST",
        body: JSON.stringify({
          situacao: conclusao.situacao,
          relato: conclusao.relato,
        }),
      });
      setMensagem("Acompanhamento atualizado.");
      setCasoSelecionado(null);
      setConclusao(null);
      setConfirmOpen(false);
      await carregar(numero, filtros);
    } catch {
      setMensagem("Não foi possível concluir o acompanhamento.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Acompanhamentos"
        description="Consulte o caso, veja em que etapa ele está e registre o desfecho quando o atendimento terminar."
      />

      {mensagem && <div className="notice">{mensagem}</div>}
      <div style={{ height: 16 }} />

      <div className="grid gap-4 md:grid-cols-3">
        <ResumoCard
          title="Em triagem"
          value={resumo?.por_situacao?.EM_TRIAGEM ?? 0}
          text="Criados pela recepção e aguardando chamada."
          tone="warn"
        />
        <ResumoCard
          title="Em atendimento"
          value={resumo?.por_situacao?.EM_ATENDIMENTO ?? 0}
          text="Já assumidos por um atendente."
          tone="bad"
        />
        <ResumoCard
          title="Finalizados/encaminhados"
          value={resumo?.finalizados ?? 0}
          text="Casos com relato ou desfecho registrado."
          tone="good"
        />
      </div>

      <div style={{ height: 16 }} />

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="!mb-0">Lista de acompanhamentos</h2>
          <Badge tone="neutral">{(pagina?.total ?? 0).toLocaleString("pt-BR")}</Badge>
        </div>

        <div className="mb-5 grid gap-4 border-b border-border/70 pb-5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Buscar">
            <Input
              type="search"
              placeholder="Protocolo ou nome do cidadão"
              defaultValue={filtros.busca}
              onChange={(event) => {
                const valor = event.currentTarget.value;
                window.clearTimeout(temporizadorDaBusca.current);
                // Espera a pessoa parar de digitar: cada tecla dispararia uma
                // consulta paginada e um resumo sobre 220 mil casos.
                temporizadorDaBusca.current = window.setTimeout(
                  () => aplicarFiltro("busca", valor),
                  350,
                );
              }}
            />
          </Field>
          <Field label="Situação">
            <Dropdown
              rotulo="Situação"
              opcoes={SITUACOES}
              value={filtros.situacao}
              onChange={(v) => aplicarFiltro("situacao", v)}
            />
          </Field>
          <Field label="Prioridade">
            <Dropdown
              rotulo="Prioridade"
              opcoes={PRIORIDADES}
              value={filtros.prioridade}
              onChange={(v) => aplicarFiltro("prioridade", v)}
            />
          </Field>
          <Field label="Ordenar por">
            <Dropdown
              rotulo="Ordenar por"
              opcoes={ORDENACOES}
              value={filtros.ordenar}
              onChange={(v) => aplicarFiltro("ordenar", v)}
            />
          </Field>
          <Field label="Aberto de">
            <CampoData
              rotulo="Aberto de"
              value={filtros.de}
              max={filtros.ate || undefined}
              onChange={(v) => aplicarFiltro("de", v)}
            />
          </Field>
          <Field label="Aberto até">
            <CampoData
              rotulo="Aberto até"
              value={filtros.ate}
              min={filtros.de || undefined}
              onChange={(v) => aplicarFiltro("ate", v)}
            />
          </Field>
          {temFiltro && (
            <div className="flex items-end">
              <SecondaryButton
                type="button"
                className="h-11"
                onClick={() => {
                  setNumero(1);
                  setFiltros(FILTROS_VAZIOS);
                }}
              >
                Limpar filtros
              </SecondaryButton>
            </div>
          )}
        </div>

        {carregando && casos.length === 0 ? (
          <EmptyState title="Carregando…" text="Buscando os acompanhamentos da sua unidade." />
        ) : casos.length === 0 ? (
          <EmptyState
            title={temFiltro ? "Nada encontrado" : "Sem acompanhamentos"}
            text={
              temFiltro
                ? "Nenhum caso corresponde aos filtros. Ajuste ou limpe os filtros para ver mais."
                : "Quando a recepção gerar uma senha, o caso aparece aqui."
            }
          />
        ) : (
          <div className="grid gap-3">
            {casos.map((caso) => (
              <button
                className="rounded-none border border-border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-background"
                key={caso.id}
                onClick={() => setCasoSelecionado(caso)}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <strong className="text-foreground">{caso.cidadao_nome}</strong>
                      <Badge tone={tomDoCaso(caso.situacao)}>{rotuloSituacao(caso.situacao)}</Badge>
                      <Badge tone={tomDaPrioridade(caso.prioridade)}>{rotuloPrioridade(caso.prioridade)}</Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{caso.servico_nome || "Serviço não informado"}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {caso.descricao || "Sem observação registrada."}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                      <ClipboardList size={14} />
                      {caso.protocolo}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                      <CalendarClock size={14} />
                      {formatarDataHora(caso.aberto_em)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <Paginacao
          pagina={pagina?.pagina ?? 1}
          paginas={pagina?.paginas ?? 1}
          total={pagina?.total ?? 0}
          porPagina={pagina?.por_pagina ?? POR_PAGINA}
          onPagina={setNumero}
          rotulo="acompanhamentos"
        />
      </Card>

      <Dialog open={Boolean(casoSelecionado)} onOpenChange={(open) => !open && setCasoSelecionado(null)}>
        <DialogContent className="max-w-3xl">
          {casoSelecionado && (
            <>
              <DialogHeader>
                <DialogTitle>Acompanhamento {casoSelecionado.protocolo}</DialogTitle>
                <DialogDescription>{textoPorSituacao(casoSelecionado)}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="rounded-none border border-border bg-background p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cidadão</p>
                      <h3 className="mt-1 text-xl text-foreground">{casoSelecionado.cidadao_nome}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={tomDoCaso(casoSelecionado.situacao)}>{rotuloSituacao(casoSelecionado.situacao)}</Badge>
                      <Badge tone={tomDaPrioridade(casoSelecionado.prioridade)}>{rotuloPrioridade(casoSelecionado.prioridade)}</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Info icon={ClipboardList} label="Serviço solicitado" value={casoSelecionado.servico_nome || "Serviço não informado"} />
                    <Info icon={MapPin} label="Unidade" value={casoSelecionado.unidade_nome} />
                    <Info icon={CalendarClock} label="Aberto em" value={formatarDataHora(casoSelecionado.aberto_em)} />
                    <Info icon={Stethoscope} label="Atendente/técnico" value={casoSelecionado.tecnico_nome || "Ainda não assumido"} />
                    {casoSelecionado.fechado_em && (
                      <Info icon={CheckCircle2} label="Finalizado em" value={formatarDataHora(casoSelecionado.fechado_em)} />
                    )}
                  </div>
                </div>

                <div className="rounded-none border border-border bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {["CONCLUIDO", "ENCAMINHADO"].includes(casoSelecionado.situacao) ? "Relato/desfecho" : "Dados da triagem"}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-foreground">
                    {casoSelecionado.descricao || "Sem observação registrada."}
                  </p>
                </div>

                {!["CONCLUIDO", "CANCELADO", "ENCAMINHADO"].includes(casoSelecionado.situacao) && (
                  <form className="grid gap-4 rounded-none border border-border bg-secondary p-5" onSubmit={prepararConclusao}>
                    <div>
                      <h3>Registrar finalização</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Use quando o atendimento técnico terminar. O relato substitui a observação inicial do caso.
                      </p>
                    </div>
                    <Field label="Situação final">
                      <Dropdown
                        name="situacao"
                        rotulo="Desfecho"
                        defaultValue="CONCLUIDO"
                        opcoes={DESFECHOS}
                      />
                    </Field>
                    <Field label="Relato do atendimento">
                      <textarea
                        className="input"
                        name="relato"
                        required
                        placeholder="Informe o que foi atendido, orientação dada, encaminhamento ou retorno combinado."
                      />
                    </Field>
                    <DialogFooter>
                      <SecondaryButton type="button" onClick={() => setCasoSelecionado(null)}>
                        Fechar
                      </SecondaryButton>
                      <Button>Salvar atendimento</Button>
                    </DialogFooter>
                  </form>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Salvar atendimento?"
        description="Confirme para registrar o relato e atualizar a situação do acompanhamento."
        confirmLabel="Salvar atendimento"
        cancelLabel="Revisar"
        onConfirm={() => void concluir()}
        isLoading={salvando}
      />
    </AppShell>
  );
}

function ResumoCard({
  title,
  value,
  text,
  tone,
}: {
  title: string;
  value: number;
  text: string;
  tone: "good" | "warn" | "bad";
}) {
  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
          <strong className="mt-2 block text-3xl text-foreground">{value.toLocaleString("pt-BR")}</strong>
          <small className="mt-1 block text-muted-foreground">{text}</small>
        </div>
        <Badge tone={tone}>{rotuloTom(tone)}</Badge>
      </div>
    </Card>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-none bg-white p-4">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Icon size={14} />
        {label}
      </p>
      <strong className="mt-2 block text-sm text-foreground">{value}</strong>
    </div>
  );
}

function textoPorSituacao(caso: Caso) {
  if (caso.situacao === "EM_TRIAGEM") {
    return "Este caso nasceu na recepção e ainda aguarda atendimento. Confira serviço, prioridade e observação da triagem.";
  }
  if (caso.situacao === "EM_ATENDIMENTO") {
    return "Este caso já foi chamado e está em atendimento. Confira quem assumiu e registre o desfecho ao finalizar.";
  }
  if (caso.situacao === "CONCLUIDO") {
    return "Este acompanhamento foi finalizado. Abaixo aparecem o relato, local e datas do atendimento.";
  }
  if (caso.situacao === "ENCAMINHADO") {
    return "Este acompanhamento foi encaminhado. Confira o relato e a unidade responsável.";
  }
  return "Confira os dados do acompanhamento.";
}

function formatarDataHora(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function rotuloSituacao(value: string) {
  const labels: Record<string, string> = {
    EM_TRIAGEM: "Em triagem",
    EM_ATENDIMENTO: "Em atendimento",
    CONCLUIDO: "Finalizado",
    ENCAMINHADO: "Encaminhado",
    CANCELADO: "Cancelado",
  };
  return labels[value] ?? value;
}

function rotuloPrioridade(value: string) {
  const labels: Record<string, string> = {
    BAIXA: "Baixa",
    NORMAL: "Normal",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };
  return labels[value] ?? value;
}

function tomDaPrioridade(value: string): "neutral" | "good" | "warn" | "bad" {
  if (value === "URGENTE") return "bad";
  if (value === "ALTA") return "warn";
  if (value === "BAIXA") return "good";
  return "neutral";
}

function tomDoCaso(value: string): "neutral" | "good" | "warn" | "bad" {
  if (value === "CONCLUIDO") return "good";
  if (value === "CANCELADO") return "neutral";
  if (value === "EM_ATENDIMENTO") return "bad";
  if (value === "EM_TRIAGEM") return "warn";
  return "neutral";
}

function rotuloTom(tone: "good" | "warn" | "bad") {
  return {
    good: "OK",
    warn: "Atenção",
    bad: "Ativo",
  }[tone];
}
