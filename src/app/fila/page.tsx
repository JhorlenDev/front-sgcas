"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ClipboardEdit,
  FolderOpen,
  ListChecks,
  Megaphone,
  RefreshCw,
  RotateCcw,
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
import { api, comQuery, mensagemDeErro } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ehEquipeDeAtendimento } from "@/lib/permissoes";
import { rotuloDaPrioridade, rotuloDaSituacaoDoCaso, tomDaPrioridade, tomDaSituacaoDoCaso } from "@/lib/rotulos";
import type {
  Caso,
  Cidadao,
  DetalheDoIndicador,
  EntradaHistorico,
  GrupoDoPainel,
  Paginado,
  PainelAtendente,
  Senha,
  SenhaEmAtendimento,
  Unidade,
} from "@/types/sgcas";
import { Paginacao } from "@/components/shared/paginacao";
import { LinkDoCaso, LinkDoCidadao } from "@/components/shared/links";
import { CartaoDeCasoFalso, FaixaDeResumosFalsa, ListaFalsa } from "@/components/skeletons/blocos";

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

const INDICADORES: Record<GrupoDoPainel, { titulo: string; descricao: string }> = {
  atendidos_hoje: { titulo: "Atendidos hoje", descricao: "Senhas finalizadas por você hoje nesta unidade." },
  aguardando_na_fila: { titulo: "Aguardando na fila", descricao: "Senhas aguardando nesta unidade, por prioridade e ordem de chegada." },
  finalizados_hoje: { titulo: "Finalizados hoje", descricao: "Casos concluídos ou encaminhados por você hoje nesta unidade." },
  casos_em_acompanhamento: { titulo: "Em acompanhamento", descricao: "Casos da unidade que não foram concluídos nem cancelados." },
};

const POR_PAGINA_DO_DETALHE = 10;

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
  // So a primeira carga. As recargas depois de chamar/concluir mantem a tela.
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState("");

  // Retomada de atendimento — portada da atualização-jhorlen (a1af3f3).
  //
  // Antes, recarregar a página no meio de um atendimento perdia a senha da
  // tela: ela seguia EM_ATENDIMENTO no banco, sem ninguém, e o próximo "Chamar
  // próximo" puxava outra pessoa. Agora a tela pergunta à API, ao abrir, se o
  // operador tem uma senha aberta, e a API devolve essa mesma senha no
  // chamar-proximo em vez de chamar outra.
  const { user } = useAuth();
  const unidadeId = user?.unidade?.id ?? null;
  const podeChamar = ehEquipeDeAtendimento(user?.papel);
  const [procurandoAtendimento, setProcurandoAtendimento] = useState(true);
  // Só vale enquanto há o que procurar: sem permissão ou sem unidade, a busca
  // nem acontece e o botão não pode ficar travado esperando por ela.
  const recuperando = procurandoAtendimento && podeChamar && Boolean(unidadeId);
  const [chamando, setChamando] = useState(false);
  // Trava síncrona contra duplo clique: o estado `chamando` só vale no próximo
  // render, e dois cliques no mesmo quadro passariam os dois.
  const chamadaEmCurso = useRef(false);
  const [abertosVisivel, setAbertosVisivel] = useState(false);
  const [abertos, setAbertos] = useState<SenhaEmAtendimento[] | null>(null);
  const [erroAbertos, setErroAbertos] = useState("");
  const [retomando, setRetomando] = useState<string | null>(null);

  // Detalhe dos indicadores — também da atualização-jhorlen, lendo o envelope
  // paginado que a API passou a devolver.
  const [indicador, setIndicador] = useState<GrupoDoPainel | null>(null);
  const [detalhe, setDetalhe] = useState<DetalheDoIndicador | null>(null);
  const [erroDetalhe, setErroDetalhe] = useState("");
  // Descarta resposta atrasada: trocar de indicador ou de página antes da
  // anterior chegar mostraria a lista errada por baixo do título certo.
  const versaoDoDetalhe = useRef(0);

  async function abrirIndicador(grupo: GrupoDoPainel, pagina = 1) {
    const versao = ++versaoDoDetalhe.current;
    setIndicador(grupo);
    setErroDetalhe("");
    if (pagina === 1) setDetalhe(null);
    try {
      const dados = await api<DetalheDoIndicador>(
        comQuery(`/queues/painel/${grupo}`, { page: pagina, limit: POR_PAGINA_DO_DETALHE }),
      );
      if (versao === versaoDoDetalhe.current) setDetalhe(dados);
    } catch (erro) {
      if (versao === versaoDoDetalhe.current) {
        setErroDetalhe(mensagemDeErro(erro, "Não foi possível carregar os registros"));
      }
    }
  }

  const carregar = useCallback(async () => {
    // O painel do atendente é `EquipeDeAtendimento`: para a recepção ele
    // devolveria 403, que apareceria como erro de carga numa tela que ela pode
    // consultar.
    const [filaResultado, painelResultado] = await Promise.allSettled([
      api<Paginado<Senha>>(comQuery("/queues/", { limit: 50 })).then((r) => r.itens),
      podeChamar ? api<PainelAtendente>("/queues/painel") : Promise.resolve(null),
    ]);
    setFila(filaResultado.status === "fulfilled" ? filaResultado.value : []);
    setPainel(painelResultado.status === "fulfilled" ? painelResultado.value : null);
    // Falha silenciosa fazia a fila parecer vazia — "ninguém aguardando" —
    // quando a verdade era "não consegui perguntar".
    setErroCarga(
      filaResultado.status === "rejected" || painelResultado.status === "rejected"
        ? "Não foi possível atualizar a fila ou o painel. Toque em Atualizar para tentar de novo."
        : "",
    );
    setCarregando(false);
  }, [podeChamar]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregar();
      void api<Unidade[]>("/institutional/units").then(setUnidades).catch(() => setUnidades([]));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [carregar]);

  /** Coloca um atendimento em "Atendimento atual", com o registro limpo. */
  const abrirNaTela = useCallback((dados: AtendimentoMontado) => {
    setAtendimento(dados);
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
  }, []);

  useEffect(() => {
    if (!user?.id || !podeChamar || !unidadeId) return;
    let cancelado = false;
    void api<AtendimentoMontado | null>("/queues/atendimento-atual")
      .then((atual) => {
        if (cancelado || !atual) return;
        abrirNaTela(atual);
        setMensagem(`A senha ${atual.senha.senha} estava aberta com você e voltou para Atendimento atual.`);
      })
      .catch((erro) => {
        // Não trava o botão: se a busca falhou, o chamar-proximo da API ainda
        // devolve a senha aberta em vez de chamar outra pessoa.
        if (!cancelado) setMensagem(mensagemDeErro(erro, "Não foi possível verificar se havia atendimento em andamento"));
      })
      .finally(() => {
        if (!cancelado) setProcurandoAtendimento(false);
      });
    return () => {
      cancelado = true;
    };
  }, [user?.id, podeChamar, unidadeId, abrirNaTela]);

  function irParaAtendimentoAtual() {
    if (!atendimentoIniciado) {
      setModoModal("inicio");
      setModalOpen(true);
      return;
    }
    document.getElementById("atendimento-atual")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function chamar() {
    if (chamadaEmCurso.current || recuperando || atendimento || !podeChamar || !unidadeId) return;
    chamadaEmCurso.current = true;
    setChamando(true);
    setMensagem("");
    try {
      const data = await api<AtendimentoMontado>("/queues/chamar-proximo", { method: "POST" });
      abrirNaTela(data);
      setModalOpen(true);
      await carregar();
    } catch (erro) {
      setMensagem(mensagemDeErro(erro, "Não foi possível chamar o próximo"));
      await carregar();
    } finally {
      chamadaEmCurso.current = false;
      setChamando(false);
    }
  }

  async function listarAbertos() {
    setAbertosVisivel(true);
    setAbertos(null);
    setErroAbertos("");
    try {
      setAbertos(await api<SenhaEmAtendimento[]>("/queues/em-atendimento"));
    } catch (erro) {
      setAbertos([]);
      setErroAbertos(mensagemDeErro(erro, "Não foi possível listar as senhas em atendimento"));
    }
  }

  async function retomar(senha: SenhaEmAtendimento) {
    if (retomando) return;
    setRetomando(senha.id);
    setErroAbertos("");
    try {
      const dados = await api<AtendimentoMontado>(`/queues/${encodeURIComponent(senha.id)}/retomar`);
      abrirNaTela(dados);
      setAbertosVisivel(false);
      setMensagem(`Senha ${dados.senha.senha} retomada em Atendimento atual.`);
      window.requestAnimationFrame(() =>
        document.getElementById("atendimento-atual")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
      await carregar();
    } catch (erro) {
      setErroAbertos(mensagemDeErro(erro, `Não foi possível retomar a senha ${senha.senha}`));
    } finally {
      setRetomando(null);
    }
  }

  /** Ação do cabeçalho: chamar, ou voltar ao atendimento que já está aberto. */
  const acoesDaTela = !podeChamar
    ? []
    : atendimento
      ? [{ rotulo: `Senha ${atendimento.senha.senha}`, icone: Stethoscope, onClick: irParaAtendimentoAtual }]
      : [{
          rotulo: chamando ? "Chamando…" : "Chamar próximo",
          icone: Megaphone,
          onClick: () => void chamar(),
          desabilitada: recuperando || chamando || !unidadeId,
        }];

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
    } catch (erro) {
      setMensagem(mensagemDeErro(erro, "Não foi possível iniciar o atendimento"));
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
    } catch (erro) {
      setMensagem(mensagemDeErro(erro, "Não foi possível registrar a observação"));
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
      setMensagem(mensagemDeErro(error, "Não foi possível encaminhar"));
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
    } catch (erro) {
      setMensagem(mensagemDeErro(erro, "Não foi possível concluir o atendimento"));
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
      setMensagem(mensagemDeErro(error, "Não foi possível marcar o não comparecimento"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Atendimento"
        description="Painel do atendente: acompanhe a fila, inicie o próximo caso e registre a conclusão."
        acoes={acoesDaTela}
      />

      <div className="grid gap-3">
        {user && podeChamar && !unidadeId && (
          <div className="notice">Seu usuário não tem unidade de lotação. Peça o vínculo a um administrador para chamar senhas.</div>
        )}
        {user && !podeChamar && (
          <div className="notice">Seu perfil acompanha a fila, mas não chama senhas nem registra atendimento.</div>
        )}
        {erroCarga && <div className="notice" role="alert">{erroCarga}</div>}
        {mensagem && <div className="notice" role="status">{mensagem}</div>}
      </div>
      <div style={{ height: 16 }} />

      {carregando ? (
        <FaixaDeResumosFalsa quantidade={5} colunas="md:grid-cols-2 xl:grid-cols-5" />
      ) : (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {/* Clicáveis só para quem tem o painel: a rota de detalhe é da equipe
            de atendimento, como o próprio painel. */}
        <MiniStat title="Atendidos hoje" value={painel?.atendidos_hoje ?? 0} detail="Finalizados pelo atendente" icon={CheckCircle2} tone="good" onClick={painel ? () => void abrirIndicador("atendidos_hoje") : undefined} />
        <MiniStat title="Aguardando na fila" value={painel?.aguardando_na_fila ?? fila.length} detail="Próximas chamadas" icon={ListChecks} tone="warn" onClick={painel ? () => void abrirIndicador("aguardando_na_fila") : undefined} />
        <MiniStat title="Em atendimento" value={painel?.em_atendimento ?? 0} detail="Senhas já chamadas" icon={Stethoscope} tone="primary" onClick={painel && unidadeId ? () => void listarAbertos() : undefined} />
        <MiniStat title="Finalizados" value={painel?.finalizados_hoje ?? 0} detail="Casos fechados hoje" icon={Clock3} tone="neutral" onClick={painel ? () => void abrirIndicador("finalizados_hoje") : undefined} />
        <MiniStat title="Acompanhamento" value={painel?.casos_em_acompanhamento ?? 0} detail="Casos ativos na unidade" icon={FolderOpen} tone="bad" onClick={painel ? () => void abrirIndicador("casos_em_acompanhamento") : undefined} />
      </div>
      )}

      <div style={{ height: 16 }} />

      <div className="grid two">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="!mb-0">Fila</h2>
              <Badge tone={fila.length ? "warn" : "good"}>{fila.length}</Badge>
            </div>
            {/* A fila não se atualiza sozinha: sem isto, a única forma de ver
                quem a recepção acabou de encaminhar era recarregar a página. */}
            <SecondaryButton type="button" className="h-10 px-4 text-xs" onClick={() => void carregar()}>
              <RefreshCw size={15} aria-hidden="true" />
              Atualizar
            </SecondaryButton>
          </div>
          {carregando ? (
            <ListaFalsa itens={5} comPastilha espaco="gap-3" />
          ) : fila.length === 0 ? (
            <EmptyState title="Fila vazia" text="A recepção ainda não encaminhou atendimentos." />
          ) : (
            // A lista empilha com `gap`: os cartões eram filhos diretos do
            // `Card`, sem espaço entre eles, e as bordas encostavam umas nas
            // outras como se fossem um bloco só.
            <ul className="flex flex-col gap-3">
              {fila.map((senha) => (
                <li className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-white" key={senha.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <strong className="flex h-11 min-w-14 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-lg text-primary-foreground">
                        {senha.senha}
                      </strong>
                      <div className="min-w-0">
                        <LinkDoCidadao id={senha.cidadao} nome={senha.cidadao_nome} className="font-semibold text-foreground" />
                        <small className="block text-muted-foreground">{senha.servico}</small>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={tomDaPrioridade(senha.prioridade)}>{rotuloDaPrioridade(senha.prioridade)}</Badge>
                      <Badge tone="neutral">{formatarDataHora(senha.criado_em)}</Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {/* `scroll-mt` desconta o cabeçalho fixo quando a tela rola até aqui. */}
            <h2 id="atendimento-atual" className="!mb-0 scroll-mt-24">Atendimento atual</h2>
            {podeChamar && unidadeId && (
              <SecondaryButton type="button" className="h-10 px-4 text-xs" onClick={() => void listarAbertos()}>
                <RotateCcw size={15} aria-hidden="true" />
                Senhas em atendimento
              </SecondaryButton>
            )}
          </div>
          {recuperando ? (
            <div aria-busy="true">
              <span className="sr-only" role="status">Verificando se há atendimento em andamento.</span>
              <ListaFalsa itens={1} linhas={3} />
            </div>
          ) : !atendimento ? (
            <EmptyState title="Nenhum atendimento iniciado" text="Use o botão chamar próximo para conferir a senha antes de iniciar." />
          ) : (
            <div className="grid">
              <div className="rounded-lg border border-border bg-background p-5">
                <div className="row">
                  <Badge tone="good">{atendimento.senha.senha}</Badge>
                  <Badge tone={tomDaPrioridade(atendimento.senha.prioridade)}>{rotuloDaPrioridade(atendimento.senha.prioridade)}</Badge>
                  <Badge tone={atendimentoIniciado ? "good" : "warn"}>
                    {atendimentoIniciado ? "Atendimento iniciado" : "Aguardando confirmação"}
                  </Badge>
                </div>
                <h3 className="mt-3"><LinkDoCidadao id={atendimento.cidadao.id} nome={atendimento.cidadao.nome} /></h3>
                <p className="text-sm text-muted-foreground">{atendimento.senha.servico}</p>
                {atendimento.caso && (
                  <div className="mt-4 rounded-lg bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Caso em atendimento</p>
                    <strong><LinkDoCaso protocolo={atendimento.caso.protocolo} /></strong>
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

        {carregando ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <CartaoDeCasoFalso key={i} />
            ))}
          </div>
        ) : !painel?.ultimos_atendimentos?.length ? (
          <EmptyState title="Sem atendimentos recentes" text="Quando você iniciar/concluir casos, eles aparecem aqui." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {painel.ultimos_atendimentos.map((caso) => (
              <article className="rounded-lg border border-border bg-white p-4" key={caso.id}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <LinkDoCidadao id={caso.cidadao} nome={caso.cidadao_nome} className="font-bold text-foreground" />
                  <Badge tone={tomDaSituacaoDoCaso(caso.situacao)}>{rotuloDaSituacaoDoCaso(caso.situacao)}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{caso.servico_nome || caso.protocolo}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{caso.descricao || "Sem relato registrado."}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={tomDaPrioridade(caso.prioridade)}>{rotuloDaPrioridade(caso.prioridade)}</Badge>
                  <Badge tone="neutral">{formatarDataHora(caso.aberto_em)}</Badge>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <Dialog
        open={indicador !== null}
        onOpenChange={(aberto) => {
          if (aberto) return;
          versaoDoDetalhe.current++;
          setIndicador(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{indicador ? INDICADORES[indicador].titulo : "Registros"}</DialogTitle>
            <DialogDescription>{indicador ? INDICADORES[indicador].descricao : ""}</DialogDescription>
          </DialogHeader>

          {erroDetalhe ? (
            <div className="notice flex flex-wrap items-center justify-between gap-3" role="alert">
              <span>{erroDetalhe}</span>
              <SecondaryButton
                type="button"
                className="h-10 px-4 text-xs"
                onClick={() => indicador && void abrirIndicador(indicador, detalhe?.pagina ?? 1)}
              >
                Tentar de novo
              </SecondaryButton>
            </div>
          ) : !detalhe ? (
            <ListaFalsa itens={4} linhas={2} espaco="gap-3" />
          ) : detalhe.itens.length === 0 ? (
            <EmptyState title="Nenhum registro" text="Não há nada por trás deste número agora." />
          ) : (
            <ul className="flex flex-col gap-3" aria-live="polite">
              {detalhe.tipo === "senhas"
                ? detalhe.itens.map((senha) => (
                    <li key={senha.id} className="flex items-center gap-3 rounded-lg border border-border bg-elevated p-4">
                      <strong className="flex h-11 min-w-14 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-lg text-primary-foreground">
                        {senha.senha}
                      </strong>
                      <span className="min-w-0 flex-1">
                        <LinkDoCidadao id={senha.cidadao} nome={senha.cidadao_nome} className="block truncate font-semibold text-foreground" />
                        <span className="block truncate text-sm text-muted-foreground">{senha.servico || "Serviço não informado"}</span>
                        <span className="mt-2 flex flex-wrap gap-2">
                          <Badge tone={tomDaPrioridade(senha.prioridade)}>{rotuloDaPrioridade(senha.prioridade)}</Badge>
                          <Badge tone="neutral">{formatarDataHora(senha.criado_em)}</Badge>
                        </span>
                      </span>
                    </li>
                  ))
                : detalhe.itens.map((caso) => (
                    <li key={caso.id} className="rounded-lg border border-border bg-elevated p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <LinkDoCidadao id={caso.cidadao} nome={caso.cidadao_nome} className="font-semibold text-foreground" />
                        <Badge tone={tomDaSituacaoDoCaso(caso.situacao)}>{rotuloDaSituacaoDoCaso(caso.situacao)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{caso.servico_nome || caso.descricao || "Serviço não informado"}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        <LinkDoCaso protocolo={caso.protocolo} /> · {caso.tecnico_nome || "Sem técnico responsável"} · {caso.unidade_nome}
                      </p>
                    </li>
                  ))}
            </ul>
          )}

          {detalhe && indicador && (
            <Paginacao
              pagina={detalhe.pagina}
              paginas={detalhe.paginas}
              total={detalhe.total}
              porPagina={detalhe.por_pagina}
              onPagina={(pagina) => void abrirIndicador(indicador, pagina)}
              rotulo={detalhe.tipo === "senhas" ? "senhas" : "casos"}
            />
          )}

          <DialogFooter>
            <SecondaryButton type="button" onClick={() => setIndicador(null)}>
              Fechar
            </SecondaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={abertosVisivel} onOpenChange={setAbertosVisivel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Senhas em atendimento</DialogTitle>
            <DialogDescription>
              Toque numa senha sua para reabri-la em Atendimento atual. As de outros atendentes mostram quem está com elas.
            </DialogDescription>
          </DialogHeader>

          {erroAbertos && (
            <div className="notice flex flex-wrap items-center justify-between gap-3" role="alert">
              <span>{erroAbertos}</span>
              <SecondaryButton type="button" className="h-10 px-4 text-xs" onClick={() => void listarAbertos()}>
                Tentar de novo
              </SecondaryButton>
            </div>
          )}

          {abertos === null ? (
            <ListaFalsa itens={3} comPastilha espaco="gap-3" />
          ) : abertos.length === 0 && !erroAbertos ? (
            <EmptyState title="Nenhuma senha em atendimento" text="Quando alguém da unidade chamar uma senha, ela aparece aqui." />
          ) : (
            <ul className="flex flex-col gap-3">
              {abertos.map((senha) => (
                <li key={senha.id}>
                  <button
                    type="button"
                    disabled={!senha.pode_retomar || retomando !== null}
                    onClick={() => void retomar(senha)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-elevated p-4 text-left transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:hover:bg-elevated"
                  >
                    <strong className="flex h-11 min-w-14 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-lg text-primary-foreground">
                      {senha.senha}
                    </strong>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">{senha.cidadao_nome}</span>
                      <span className="block truncate text-sm text-muted-foreground">{senha.servico || "Serviço não informado"}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {senha.pode_retomar ? "Com você" : `Com ${senha.operador_nome ?? "outro atendente"}`}
                        {senha.chamado_em ? ` · chamada às ${formatarDataHora(senha.chamado_em)}` : ""}
                      </span>
                    </span>
                    {senha.pode_retomar && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">
                        {retomando === senha.id ? "Abrindo…" : "Retomar"}
                        <ArrowRight size={14} aria-hidden="true" />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <DialogFooter>
            <SecondaryButton type="button" onClick={() => setAbertosVisivel(false)}>
              Fechar
            </SecondaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          {atendimento && (
            <>
              <DialogHeader>
                <DialogTitle>{tituloDoModal(modoModal, atendimento.senha.senha)}</DialogTitle>
                <DialogDescription>{descricaoDoModal(modoModal)}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="rounded-lg border border-border bg-background p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge tone="good">{atendimento.senha.senha}</Badge>
                        <Badge tone={tomDaPrioridade(atendimento.senha.prioridade)}>{rotuloDaPrioridade(atendimento.senha.prioridade)}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground"><LinkDoCidadao id={atendimento.cidadao.id} nome={atendimento.cidadao.nome} /></h3>
                      <p className="mt-1 text-sm text-muted-foreground">{atendimento.senha.servico || "Serviço não informado"}</p>
                    </div>
                    {atendimento.caso && (
                      <div className="rounded-lg bg-white px-4 py-3 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Caso</p>
                        <strong className="text-foreground"><LinkDoCaso protocolo={atendimento.caso.protocolo} /></strong>
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
                    <div className="rounded-lg border border-[var(--pmt-color-danger)] bg-[var(--pmt-color-danger-soft)] p-4">
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
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="!text-base">Histórico rápido</h3>
        <Badge tone="neutral">{historico.length}</Badge>
      </div>
      {historico.length === 0 ? (
        <EmptyState title="Sem histórico recente" text="Pode iniciar o atendimento normalmente." />
      ) : (
        <div className="grid gap-2">
          {historico.slice(0, 4).map((entrada, index) => (
            <div className="rounded-lg bg-secondary p-3" key={`${entrada.quando}-${index}`}>
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
    <div className="grid gap-4 rounded-lg border border-border bg-secondary p-4">
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

/**
 * Indicador do painel. Com `onClick`, o cartão inteiro vira botão e abre os
 * registros por trás do número.
 *
 * O botão é o próprio cartão (classe `.card`), com `<span>` por dentro — e não
 * um `<Card>` embrulhado num `<button>`: `<section>` e `<p>` não podem ficar
 * dentro de botão, e leitor de tela lê esse aninhamento de forma imprevisível.
 */
function MiniStat({
  title,
  value,
  detail,
  icon: Icon,
  tone,
  onClick,
}: {
  title: string;
  value: number;
  detail: string;
  icon: React.ElementType;
  tone: "primary" | "neutral" | "good" | "warn" | "bad";
  onClick?: () => void;
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    neutral: "bg-secondary text-foreground",
    good: "bg-success/10 text-success",
    warn: "bg-[var(--pmt-color-warning-soft)] text-[var(--pmt-color-warning-soft-fg)]",
    bad: "bg-destructive/10 text-destructive",
  }[tone];

  const conteudo = (
    <span className="flex items-start justify-between gap-3">
      <span className="block">
        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</span>
        <strong className="mt-2 block text-3xl text-foreground">{value.toLocaleString("pt-BR")}</strong>
        <small className="mt-1 block text-muted-foreground">{detail}</small>
        {onClick && (
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Ver registros
            <ArrowRight size={13} aria-hidden="true" />
          </span>
        )}
      </span>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
    </span>
  );

  if (!onClick) {
    return <div className="card !p-4">{conteudo}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="card !p-4 w-full text-left hover:border-primary/40 hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {conteudo}
    </button>
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

