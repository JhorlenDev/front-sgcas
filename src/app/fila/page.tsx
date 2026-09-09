"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ClipboardEdit,
  FolderOpen,
  ListChecks,
  Send,
  Stethoscope,
  UserX,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AreaDeTexto, Badge, Button, CampoData, Card, Dropdown, EmptyState, Field, Input, PageHeader, SecondaryButton } from "@/components/ui";
import { api, comQuery } from "@/lib/api";
import type { Caso, Cidadao, EntradaHistorico, Paginado, PainelAtendente, Senha, Unidade } from "@/types/sgcas";

const SITUACOES_IDENTIFICADAS = [
  { value: "Atualização cadastral ou orientação simples", label: "Atualização/orientação" },
  { value: "Vulnerabilidade social relatada", label: "Vulnerabilidade social" },
  { value: "Solicitação de benefício eventual", label: "Benefício eventual" },
  { value: "Acompanhamento familiar em andamento", label: "Acompanhamento familiar" },
  { value: "Violação de direitos ou risco social", label: "Risco/violação de direitos" },
  { value: "Encaminhamento solicitado por outro órgão", label: "Encaminhamento de outro órgão" },
];

const PROVIDENCIAS = [
  { value: "Orientação registrada", label: "Orientação registrada" },
  { value: "Documentos conferidos", label: "Documentos conferidos" },
  { value: "Benefício avaliado ou solicitado", label: "Benefício avaliado/solicitado" },
  { value: "Encaminhamento preparado", label: "Encaminhamento preparado" },
  { value: "Retorno combinado com o cidadão", label: "Retorno combinado" },
  { value: "Atendimento concluído no setor", label: "Concluído no setor" },
];

type AtendimentoMontado = {
  senha: Senha;
  cidadao: Cidadao;
  caso: Caso | null;
  historico: EntradaHistorico[];
};

export default function FilaPage() {
  const [fila, setFila] = useState<Senha[]>([]);
  const [painel, setPainel] = useState<PainelAtendente | null>(null);
  const [atendimento, setAtendimento] = useState<AtendimentoMontado | null>(null);
  const [atendimentoIniciado, setAtendimentoIniciado] = useState(false);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modoModal, setModoModal] = useState<"inicio" | "observacao" | "encaminhar" | "concluir" | "naoCompareceu">("inicio");
  const [observacao, setObservacao] = useState("");
  const [relato, setRelato] = useState("");
  const [situacaoIdentificada, setSituacaoIdentificada] = useState("");
  const [providencia, setProvidencia] = useState("");
  const [retornoNecessario, setRetornoNecessario] = useState("");
  const [dataRetorno, setDataRetorno] = useState("");
  const [unidadeDestinoId, setUnidadeDestinoId] = useState("");
  const [destinoExterno, setDestinoExterno] = useState("");
  const [motivoEncaminhamento, setMotivoEncaminhamento] = useState("");
  const [observacaoEncaminhamento, setObservacaoEncaminhamento] = useState("");
  const [motivoNaoCompareceu, setMotivoNaoCompareceu] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    const [filaData, painelData] = await Promise.all([
      api<Paginado<Senha>>(comQuery("/queues/", { limit: 50 }))
        .then((r) => r.itens)
        .catch(() => []),
      api<PainelAtendente>("/queues/painel").catch(() => null),
    ]);
    setFila(filaData);
    setPainel(painelData);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregar();
      void api<Unidade[]>("/institutional/units").then(setUnidades).catch(() => setUnidades([]));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function chamar() {
    setMensagem("");
    try {
      const data = await api<AtendimentoMontado>("/queues/chamar-proximo", { method: "POST" });
      setAtendimento(data);
      setAtendimentoIniciado(false);
      setModoModal("inicio");
      setObservacao("");
      setRelato("");
      setSituacaoIdentificada("");
      setProvidencia("");
      setRetornoNecessario("");
      setDataRetorno("");
      setUnidadeDestinoId("");
      setDestinoExterno("");
      setMotivoEncaminhamento("");
      setObservacaoEncaminhamento("");
      setMotivoNaoCompareceu("");
      setModalOpen(true);
      await carregar();
    } catch {
      setMensagem("Não há ninguém aguardando.");
    }
  }

  function montarRegistroGuiado() {
    const partes = [
      situacaoIdentificada ? `Situação identificada: ${situacaoIdentificada}.` : null,
      providencia ? `Providência tomada: ${providencia}.` : null,
      retornoNecessario === "SIM"
        ? `Retorno necessário: sim${dataRetorno ? `, previsto para ${formatarDataSimples(dataRetorno)}` : ""}.`
        : retornoNecessario === "NAO"
          ? "Retorno necessário: não."
          : null,
      observacao.trim() ? `Observação: ${observacao.trim()}` : null,
    ].filter(Boolean);

    return partes.join("\n");
  }

  async function salvarObservacaoAtual(texto?: string) {
    const conteudo = (texto ?? observacao).trim();
    if (!atendimento?.caso || !conteudo) return atendimento?.caso ?? null;
    const casoAtualizado = await api<Caso>(`/cases/${atendimento.caso.id}/observacao`, {
      method: "POST",
      body: JSON.stringify({ observacao: conteudo }),
    });
    setAtendimento((atual) => (atual ? { ...atual, caso: casoAtualizado } : atual));
    setObservacao("");
    return casoAtualizado;
  }

  async function iniciarAtendimento() {
    if (!atendimento) return;
    setSalvando(true);
    setMensagem("");
    try {
      await salvarObservacaoAtual(montarRegistroGuiado());
      setAtendimentoIniciado(true);
      setModalOpen(false);
      setMensagem(`Senha ${atendimento.senha.senha} em atendimento.`);
      await carregar();
    } catch {
      setMensagem("Não foi possível iniciar o atendimento.");
    } finally {
      setSalvando(false);
    }
  }

  function abrirModo(modo: "observacao" | "encaminhar" | "concluir" | "naoCompareceu") {
    setModoModal(modo);
    setMensagem("");
    setModalOpen(true);
  }

  async function salvarObservacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!atendimento?.caso) return;
    setSalvando(true);
    try {
      await salvarObservacaoAtual(montarRegistroGuiado());
      setModalOpen(false);
      setMensagem("Observação registrada no acompanhamento.");
      await carregar();
    } catch {
      setMensagem("Não foi possível registrar a observação.");
    } finally {
      setSalvando(false);
    }
  }

  async function encaminhar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!atendimento?.caso) return;
    setSalvando(true);
    setMensagem("");
    try {
      await api(`/cases/${atendimento.caso.id}/encaminhar`, {
        method: "POST",
        body: JSON.stringify({
          unidade_destino_id: unidadeDestinoId || null,
          destino_externo: unidadeDestinoId ? null : destinoExterno.trim(),
          motivo: motivoEncaminhamento.trim(),
          observacoes: observacaoEncaminhamento.trim() || null,
        }),
      });
      setAtendimento(null);
      setAtendimentoIniciado(false);
      setModalOpen(false);
      setMensagem("Atendimento encaminhado e senha finalizada.");
      await carregar();
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Não foi possível encaminhar.");
    } finally {
      setSalvando(false);
    }
  }

  async function concluir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!atendimento?.caso) return;
    setSalvando(true);
    setMensagem("");
    try {
      await api(`/cases/${atendimento.caso.id}/concluir`, {
        method: "POST",
        body: JSON.stringify({
          situacao: "CONCLUIDO",
          relato: relato.trim() || montarRegistroGuiado() || "Atendimento concluído sem observações adicionais.",
        }),
      });
      setAtendimento(null);
      setAtendimentoIniciado(false);
      setModalOpen(false);
      setMensagem("Atendimento concluído e senha finalizada.");
      await carregar();
    } catch {
      setMensagem("Não foi possível concluir o atendimento.");
    } finally {
      setSalvando(false);
    }
  }

  async function marcarNaoCompareceu(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!atendimento) return;
    setSalvando(true);
    setMensagem("");
    try {
      await api(`/queues/${atendimento.senha.id}/nao-compareceu`, {
        method: "POST",
        body: JSON.stringify({
          motivo: motivoNaoCompareceu.trim() || null,
        }),
      });
      setAtendimento(null);
      setAtendimentoIniciado(false);
      setModalOpen(false);
      setMotivoNaoCompareceu("");
      setMensagem("Senha marcada como não compareceu.");
      await carregar();
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Não foi possível marcar não comparecimento.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Atendimento"
        description="Painel do atendente: acompanhe a fila, inicie o próximo caso e registre a conclusão."
        action={<Button onClick={chamar}>Chamar próximo</Button>}
      />

      {mensagem && <div className="notice">{mensagem}</div>}
      <div style={{ height: 16 }} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MiniStat title="Atendidos hoje" value={painel?.atendidos_hoje ?? 0} detail="Finalizados pelo atendente" icon={CheckCircle2} tone="good" />
        <MiniStat title="Aguardando na fila" value={painel?.aguardando_na_fila ?? fila.length} detail="Próximas chamadas" icon={ListChecks} tone="warn" />
        <MiniStat title="Em atendimento" value={painel?.em_atendimento ?? 0} detail="Senhas já chamadas" icon={Stethoscope} tone="primary" />
        <MiniStat title="Finalizados" value={painel?.finalizados_hoje ?? 0} detail="Casos fechados hoje" icon={Clock3} tone="neutral" />
        <MiniStat title="Acompanhamento" value={painel?.casos_em_acompanhamento ?? 0} detail="Casos ativos na unidade" icon={FolderOpen} tone="bad" />
      </div>

      <div style={{ height: 16 }} />

      <div className="grid two">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="!mb-0">Fila</h2>
            <Badge tone={fila.length ? "warn" : "good"}>{fila.length}</Badge>
          </div>
          {fila.length === 0 ? (
            <EmptyState title="Fila vazia" text="A recepção ainda não encaminhou atendimentos." />
          ) : (
            fila.map((senha) => (
              <div className="rounded-none border border-border bg-background p-4 transition-all hover:bg-white hover:" key={senha.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <strong className="flex h-11 min-w-14 items-center justify-center rounded-none bg-primary px-3 text-lg text-primary-foreground">
                      {senha.senha}
                    </strong>
                    <div>
                      <span className="font-semibold text-foreground">{senha.cidadao_nome}</span>
                      <small className="block text-muted-foreground">{senha.servico}</small>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={tomDaPrioridade(senha.prioridade)}>{rotuloPrioridade(senha.prioridade)}</Badge>
                    <Badge tone="neutral">{formatarDataHora(senha.criado_em)}</Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>

        <Card>
          <h2>Atendimento atual</h2>
          {!atendimento ? (
            <EmptyState title="Nenhum atendimento iniciado" text="Use o botão chamar próximo para conferir a senha antes de iniciar." />
          ) : (
            <div className="grid">
              <div className="rounded-none border border-border bg-background p-5">
                <div className="row">
                  <Badge tone="good">{atendimento.senha.senha}</Badge>
                  <Badge tone="warn">{atendimento.senha.prioridade}</Badge>
                  <Badge tone={atendimentoIniciado ? "good" : "warn"}>
                    {atendimentoIniciado ? "Atendimento iniciado" : "Aguardando confirmação"}
                  </Badge>
                </div>
                <h3 className="mt-3">{atendimento.cidadao.nome}</h3>
                <p className="text-sm text-muted-foreground">{atendimento.senha.servico}</p>
                {atendimento.caso && (
                  <div className="mt-4 rounded-lg bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Caso em atendimento</p>
                    <strong>{atendimento.caso.protocolo}</strong>
                    <p className="text-sm text-muted-foreground">{atendimento.caso.descricao || atendimento.caso.situacao}</p>
                  </div>
                )}
              </div>
              {!atendimentoIniciado ? (
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Button type="button" onClick={() => {
                    setModoModal("inicio");
                    setModalOpen(true);
                  }}>
                    Abrir conferência
                    <ArrowRight size={16} />
                  </Button>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--pmt-color-danger)] bg-[var(--pmt-color-danger-soft)] px-4 text-sm font-semibold text-[var(--pmt-color-danger-soft-fg)] transition-all hover:bg-[var(--pmt-color-danger-soft)]"
                    onClick={() => abrirModo("naoCompareceu")}
                  >
                    <UserX size={16} />
                    Não compareceu
                  </button>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <SecondaryButton type="button" className="h-10 px-3 text-xs" onClick={() => abrirModo("observacao")}>
                    <ClipboardEdit size={15} />
                    Observação
                  </SecondaryButton>
                  <SecondaryButton type="button" className="h-10 px-3 text-xs" onClick={() => abrirModo("encaminhar")}>
                    <Send size={15} />
                    Encaminhar
                  </SecondaryButton>
                  <Button type="button" className="h-10 px-3 text-xs" onClick={() => abrirModo("concluir")}>
                    <CheckCircle2 size={15} />
                    Concluir
                  </Button>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--pmt-color-danger)] bg-[var(--pmt-color-danger-soft)] px-3 text-xs font-semibold text-[var(--pmt-color-danger-soft-fg)] transition-all hover:bg-[var(--pmt-color-danger-soft)]"
                    onClick={() => abrirModo("naoCompareceu")}
                  >
                    <UserX size={15} />
                    Não veio
                  </button>
                </div>
              )}
              <h3>Histórico do cidadão</h3>
              {atendimento.historico.length === 0 ? (
                <EmptyState title="Sem histórico recente" text="Não há registros recentes para este cidadão." />
              ) : (
                atendimento.historico.map((entrada, index) => (
                  <div className="line-row" key={`${entrada.quando}-${index}`}>
                    <strong>{entrada.o_que}</strong>
                    <small>{entrada.unidade}{entrada.detalhe ? ` · ${entrada.detalhe}` : ""}</small>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>

      <div style={{ height: 16 }} />

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="!mb-1">Últimos atendimentos</h2>
            <p className="text-sm leading-6 text-muted-foreground">Casos mais recentes assumidos por você.</p>
          </div>
          <Badge tone="neutral">{painel?.ultimos_atendimentos?.length ?? 0}</Badge>
        </div>

        {!painel?.ultimos_atendimentos?.length ? (
          <EmptyState title="Sem atendimentos recentes" text="Quando você iniciar/concluir casos, eles aparecem aqui." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {painel.ultimos_atendimentos.map((caso) => (
              <article className="rounded-none border border-border bg-white p-4" key={caso.id}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-foreground">{caso.cidadao_nome}</strong>
                  <Badge tone={tomDoCaso(caso.situacao)}>{rotuloSituacao(caso.situacao)}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{caso.servico_nome || caso.protocolo}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{caso.descricao || "Sem relato registrado."}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={tomDaPrioridade(caso.prioridade)}>{rotuloPrioridade(caso.prioridade)}</Badge>
                  <Badge tone="neutral">{formatarDataHora(caso.aberto_em)}</Badge>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {atendimento && (
            <>
              <DialogHeader>
                <DialogTitle>{tituloDoModal(modoModal, atendimento.senha.senha)}</DialogTitle>
                <DialogDescription>{descricaoDoModal(modoModal)}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="rounded-none border border-border bg-background p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge tone="good">{atendimento.senha.senha}</Badge>
                        <Badge tone={tomDaPrioridade(atendimento.senha.prioridade)}>{rotuloPrioridade(atendimento.senha.prioridade)}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">{atendimento.cidadao.nome}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{atendimento.senha.servico || "Serviço não informado"}</p>
                    </div>
                    {atendimento.caso && (
                      <div className="rounded-none bg-white px-4 py-3 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Caso</p>
                        <strong className="text-foreground">{atendimento.caso.protocolo}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {modoModal === "inicio" && (
                  <div className="grid gap-4">
                    <RegistroGuiado
                      observacao={observacao}
                      setObservacao={setObservacao}
                      situacaoIdentificada={situacaoIdentificada}
                      setSituacaoIdentificada={setSituacaoIdentificada}
                      providencia={providencia}
                      setProvidencia={setProvidencia}
                      retornoNecessario={retornoNecessario}
                      setRetornoNecessario={setRetornoNecessario}
                      dataRetorno={dataRetorno}
                      setDataRetorno={setDataRetorno}
                      compacto
                    />

                    <ResumoHistorico historico={atendimento.historico} />

                    <DialogFooter>
                      <SecondaryButton type="button" onClick={() => setModalOpen(false)} disabled={salvando}>
                        Conferir depois
                      </SecondaryButton>
                      <button
                        type="button"
                        className="button border border-[var(--pmt-color-danger)] !bg-[var(--pmt-color-danger-soft)] !text-[var(--pmt-color-danger-soft-fg)] shadow-none hover:!bg-[var(--pmt-color-danger-soft)]"
                        onClick={() => abrirModo("naoCompareceu")}
                        disabled={salvando}
                      >
                        <UserX size={16} />
                        Não compareceu
                      </button>
                      <Button type="button" onClick={() => void iniciarAtendimento()} disabled={salvando}>
                        {salvando ? "Iniciando..." : "Iniciar atendimento"}
                      </Button>
                    </DialogFooter>
                  </div>
                )}

                {modoModal === "observacao" && (
                  <form className="grid gap-4" onSubmit={salvarObservacao}>
                    <RegistroGuiado
                      observacao={observacao}
                      setObservacao={setObservacao}
                      situacaoIdentificada={situacaoIdentificada}
                      setSituacaoIdentificada={setSituacaoIdentificada}
                      providencia={providencia}
                      setProvidencia={setProvidencia}
                      retornoNecessario={retornoNecessario}
                      setRetornoNecessario={setRetornoNecessario}
                      dataRetorno={dataRetorno}
                      setDataRetorno={setDataRetorno}
                    />
                    <DialogFooter>
                      <SecondaryButton type="button" onClick={() => setModalOpen(false)} disabled={salvando}>
                        Cancelar
                      </SecondaryButton>
                      <Button disabled={salvando}>{salvando ? "Salvando..." : "Salvar observação"}</Button>
                    </DialogFooter>
                  </form>
                )}

                {modoModal === "encaminhar" && (
                  <form className="grid gap-4" onSubmit={encaminhar}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Unidade da rede">
                        <Dropdown
                          rotulo="Unidade da rede"
                          value={unidadeDestinoId}
                          onChange={(valor) => {
                            setUnidadeDestinoId(valor);
                            if (valor) setDestinoExterno("");
                          }}
                          opcoes={[
                            { value: "", label: "Encaminhamento externo", hint: "Fora da rede socioassistencial" },
                            ...unidades.map((u) => ({ value: u.id, label: u.nome })),
                          ]}
                        />
                      </Field>
                      <Field label="Destino externo">
                        <Input
                          value={destinoExterno}
                          onChange={(event) => setDestinoExterno(event.target.value)}
                          disabled={Boolean(unidadeDestinoId)}
                          placeholder="Ex.: Conselho Tutelar, Saúde, Defensoria"
                        />
                      </Field>
                    </div>
                    <Field label="Motivo">
                      <AreaDeTexto
                        value={motivoEncaminhamento}
                        onChange={(event) => setMotivoEncaminhamento(event.target.value)}
                        required
                        placeholder="Explique por que este atendimento precisa seguir para outro setor."
                      />
                    </Field>
                    <Field label="Observações, opcional">
                      <AreaDeTexto
                        value={observacaoEncaminhamento}
                        onChange={(event) => setObservacaoEncaminhamento(event.target.value)}
                        placeholder="Documentos entregues, orientação dada, prazo combinado..."
                      />
                    </Field>
                    <DialogFooter>
                      <SecondaryButton type="button" onClick={() => setModalOpen(false)} disabled={salvando}>
                        Cancelar
                      </SecondaryButton>
                      <Button disabled={salvando}>{salvando ? "Encaminhando..." : "Encaminhar atendimento"}</Button>
                    </DialogFooter>
                  </form>
                )}

                {modoModal === "concluir" && (
                  <form className="grid gap-4" onSubmit={concluir}>
                    <Field label="Relato final">
                      <AreaDeTexto
                        value={relato}
                        onChange={(event) => setRelato(event.target.value)}
                        placeholder="Se quiser, escreva um resumo final. Se deixar vazio, os campos guiados viram o relato."
                      />
                    </Field>
                    <DialogFooter>
                      <SecondaryButton type="button" onClick={() => setModalOpen(false)} disabled={salvando}>
                        Cancelar
                      </SecondaryButton>
                      <Button disabled={salvando}>{salvando ? "Concluindo..." : "Concluir atendimento"}</Button>
                    </DialogFooter>
                  </form>
                )}

                {modoModal === "naoCompareceu" && (
                  <form className="grid gap-4" onSubmit={marcarNaoCompareceu}>
                    <div className="rounded-none border border-[var(--pmt-color-danger)] bg-[var(--pmt-color-danger-soft)] p-4">
                      <div className="flex gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--pmt-color-danger-soft-fg)]">
                          <UserX size={18} />
                        </span>
                        <div>
                          <strong className="block text-sm text-[var(--pmt-color-danger-soft-fg)]">Confirmar não comparecimento?</strong>
                          <p className="mt-1 text-sm leading-6 text-[var(--pmt-color-danger-soft-fg)]">
                            A senha será marcada como desistência e o caso será encerrado como cancelado.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Field label="Motivo, opcional">
                      <AreaDeTexto
                        value={motivoNaoCompareceu}
                        onChange={(event) => setMotivoNaoCompareceu(event.target.value)}
                        placeholder="Ex.: chamado três vezes, cidadão saiu da unidade, não respondeu..."
                      />
                    </Field>
                    <DialogFooter>
                      <SecondaryButton type="button" onClick={() => setModalOpen(false)} disabled={salvando}>
                        Cancelar
                      </SecondaryButton>
                      <button
                        className="button border border-[var(--pmt-color-danger)] !bg-destructive !text-white hover:!bg-destructive"
                        disabled={salvando}
                      >
                        {salvando ? "Marcando..." : "Confirmar não compareceu"}
                      </button>
                    </DialogFooter>
                  </form>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function ResumoHistorico({ historico }: { historico: EntradaHistorico[] }) {
  return (
    <div className="rounded-none border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="!text-base">Histórico rápido</h3>
        <Badge tone="neutral">{historico.length}</Badge>
      </div>
      {historico.length === 0 ? (
        <EmptyState title="Sem histórico recente" text="Pode iniciar o atendimento normalmente." />
      ) : (
        <div className="grid gap-2">
          {historico.slice(0, 4).map((entrada, index) => (
            <div className="rounded-none bg-secondary p-3" key={`${entrada.quando}-${index}`}>
              <strong className="block text-sm text-foreground">{entrada.o_que}</strong>
              <small className="mt-1 block text-xs leading-5 text-muted-foreground">
                {formatarDataHora(entrada.quando)} · {entrada.unidade}{entrada.detalhe ? ` · ${entrada.detalhe}` : ""}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RegistroGuiado({
  observacao,
  setObservacao,
  situacaoIdentificada,
  setSituacaoIdentificada,
  providencia,
  setProvidencia,
  retornoNecessario,
  setRetornoNecessario,
  dataRetorno,
  setDataRetorno,
  compacto = false,
}: {
  observacao: string;
  setObservacao: (value: string) => void;
  situacaoIdentificada: string;
  setSituacaoIdentificada: (value: string) => void;
  providencia: string;
  setProvidencia: (value: string) => void;
  retornoNecessario: string;
  setRetornoNecessario: (value: string) => void;
  dataRetorno: string;
  setDataRetorno: (value: string) => void;
  compacto?: boolean;
}) {
  return (
    <div className="grid gap-4 rounded-none border border-border bg-secondary p-4">
      <div>
        <h3 className="!text-base">Registro do atendimento</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Preencha só o que fizer sentido. O sistema organiza isso no histórico do caso.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Situação identificada">
          <Dropdown
            rotulo="Situação identificada"
            placeholder="Selecione, se aplicável"
            value={situacaoIdentificada}
            onChange={setSituacaoIdentificada}
            opcoes={SITUACOES_IDENTIFICADAS}
          />
        </Field>

        <Field label="Providência">
          <Dropdown
            rotulo="Providência"
            placeholder="Selecione, se aplicável"
            value={providencia}
            onChange={setProvidencia}
            opcoes={PROVIDENCIAS}
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.8fr_1fr]">
        <Field label="Retorno necessário?">
          <Dropdown
            rotulo="Retorno necessário?"
            placeholder="Definir depois"
            value={retornoNecessario}
            onChange={setRetornoNecessario}
            opcoes={[{ value: "NAO", label: "Não" }, { value: "SIM", label: "Sim" }]}
          />
        </Field>

        {retornoNecessario === "SIM" && (
          <Field label="Data prevista">
            <CampoData rotulo="Data prevista de retorno" value={dataRetorno} onChange={setDataRetorno} />
          </Field>
        )}
      </div>

      <Field label={compacto ? "Observação inicial" : "Observação/evolução"}>
        <AreaDeTexto
          value={observacao}
          onChange={(event) => setObservacao(event.target.value)}
          placeholder="Ex.: cidadão trouxe documentos, orientação dada, pendência, combinado de retorno..."
        />
      </Field>
    </div>
  );
}

function MiniStat({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  detail: string;
  icon: React.ElementType;
  tone: "primary" | "neutral" | "good" | "warn" | "bad";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    neutral: "bg-secondary text-foreground",
    good: "bg-success/10 text-success",
    warn: "bg-[var(--pmt-color-warning-soft)] text-[var(--pmt-color-warning-soft-fg)]",
    bad: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
          <strong className="mt-2 block text-3xl text-foreground">{value.toLocaleString("pt-BR")}</strong>
          <small className="mt-1 block text-muted-foreground">{detail}</small>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
          <Icon size={18} />
        </span>
      </div>
    </Card>
  );
}

function formatarDataHora(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatarDataSimples(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
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

function rotuloSituacao(value: string) {
  const labels: Record<string, string> = {
    EM_TRIAGEM: "Na fila/triagem",
    EM_ATENDIMENTO: "Em atendimento",
    CONCLUIDO: "Concluído",
    ENCAMINHADO: "Encaminhado",
    CANCELADO: "Cancelado",
  };
  return labels[value] ?? value;
}

function tituloDoModal(modo: "inicio" | "observacao" | "encaminhar" | "concluir" | "naoCompareceu", senha: string) {
  const titulos = {
    inicio: `Conferir senha ${senha}`,
    observacao: "Registrar observação",
    encaminhar: "Encaminhar atendimento",
    concluir: "Concluir atendimento",
    naoCompareceu: "Não compareceu",
  };
  return titulos[modo];
}

function descricaoDoModal(modo: "inicio" | "observacao" | "encaminhar" | "concluir" | "naoCompareceu") {
  const descricoes = {
    inicio: "Confira cidadão, serviço e histórico antes de assumir o atendimento.",
    observacao: "Adicione uma evolução sem encerrar o caso.",
    encaminhar: "Envie o caso para outra unidade da rede ou registre um destino externo.",
    concluir: "Finalize o atendimento e libere a senha da fila.",
    naoCompareceu: "Use quando a senha foi chamada e o cidadão não se apresentou.",
  };
  return descricoes[modo];
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
  if (value === "EM_ATENDIMENTO") return "warn";
  return "bad";
}
