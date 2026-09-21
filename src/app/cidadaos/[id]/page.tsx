"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck, CalendarClock, ClipboardList, Download, FileText, Gift, Home, IdCard,
  Paperclip, Phone, Printer, Send, ShieldCheck, Stethoscope, Users, Wallet,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BotaoRegistrar, RegistrarBeneficio, RegistrarEncaminhamento } from "@/components/cidadaos/acoes-do-prontuario";
import { LinkDoCaso } from "@/components/shared/links";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { api, urlDaApi } from "@/lib/api";
import {
  faixaEtaria, formatarCEP, formatarDinheiro, formatarNIS, formatarTelefone, rotular,
  rotuloDaSituacaoDoCaso, tomDaSituacaoDoCaso,
} from "@/lib/rotulos";
import { formatCPF, formatDate, formatDateOnly } from "@/lib/utils";
import type { Cidadao, ProntuarioCidadao, Unidade } from "@/types/sgcas";
import {
  ListaDaFichaFalsa,
  SecaoDeFichaFalsa,
} from "@/components/skeletons/blocos";
import { Skeleton } from "@/components/ui/skeleton";

/** Situações de um caso que ainda pede trabalho de alguém. */
const EM_ABERTO = ["EM_TRIAGEM", "EM_ATENDIMENTO"];

export default function ProntuarioPage() {
  const params = useParams<{ id: string }>();
  const [prontuario, setProntuario] = useState<ProntuarioCidadao | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [erro, setErro] = useState("");
  const [registrando, setRegistrando] = useState<"beneficio" | "encaminhamento" | null>(null);

  // Uma chamada só: cadastro, casos, histórico, benefícios, encaminhamentos,
  // senhas e atendimentos de balcão. Eram três chamadas, e a ficha montava em
  // pedaços — cada seção chegando numa hora.
  useEffect(() => {
    void api<ProntuarioCidadao>(`/citizens/${params.id}/prontuario`)
      .then(setProntuario)
      .catch(() => setErro("Não foi possível abrir este prontuário."));
    // A lista de unidades só serve ao destino do encaminhamento; se falhar, o
    // formulário ainda aceita serviço de fora da rede.
    void api<Unidade[]>("/institutional/units").then(setUnidades).catch(() => setUnidades([]));
  }, [params.id]);

  // Depois de registrar benefício ou encaminhamento: a lista e os contadores do
  // topo precisam mostrar o que acabou de ser gravado.
  const recarregar = useCallback(async () => {
    setProntuario(await api<ProntuarioCidadao>(`/citizens/${params.id}/prontuario`));
  }, [params.id]);

  // A ficha inteira renderiza com "Não informado" em todo campo enquanto a
  // resposta não chega — o que não é uma tela em branco, é pior: parece um
  // cadastro vazio de verdade. O esqueleto diz que os dados estão vindo.
  if (!prontuario && !erro) {
    return (
      <AppShell>
        <PageHeader title="Prontuário" description="Carregando o cadastro da pessoa." />
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]" aria-busy="true">
          <div className="grid gap-5">
            <SecaoDeFichaFalsa campos={12} larguraDoTitulo="w-32" />
            <SecaoDeFichaFalsa campos={2} larguraDoTitulo="w-20" />
            <SecaoDeFichaFalsa campos={8} larguraDoTitulo="w-40" />
            <SecaoDeFichaFalsa campos={10} larguraDoTitulo="w-48" />
          </div>
          <div className="grid gap-5 self-start">
            <SecaoDeFichaFalsa campos={2} larguraDoTitulo="w-44" />
            <SecaoDeFichaFalsa larguraDoTitulo="w-40"><ListaDaFichaFalsa itens={3} /></SecaoDeFichaFalsa>
            <SecaoDeFichaFalsa larguraDoTitulo="w-36"><ListaDaFichaFalsa itens={3} /></SecaoDeFichaFalsa>
            <SecaoDeFichaFalsa larguraDoTitulo="w-44"><ListaDaFichaFalsa itens={4} /></SecaoDeFichaFalsa>
          </div>
        </div>
        <span className="sr-only" role="status">Carregando o prontuário do cidadão.</span>
      </AppShell>
    );
  }

  if (erro || !prontuario) {
    return (
      <AppShell>
        <PageHeader title="Prontuário" description="" />
        <EmptyState title="Sem acesso" text={erro} />
      </AppShell>
    );
  }

  const { cidadao, casos, historico, beneficios_eventuais: beneficios, encaminhamentos } = prontuario;
  const socio = prontuario.socioeconomico ?? {};
  const moradia = prontuario.endereco_detalhado ?? {};
  const familia = prontuario.membros_da_familia ?? [];
  const anexos = prontuario.anexos ?? [];
  const emAberto = casos.filter((c) => EM_ABERTO.includes(c.situacao));
  const passagens = [
    ...prontuario.atendimentos_recepcao.map((a) => ({
      id: `a-${a.id}`,
      quando: a.criado_em,
      titulo: `${rotular("desfechoDaRecepcao", a.desfecho)} · ${a.demanda}`,
      detalhe: [a.unidade_nome, a.atendido_por_nome].filter(Boolean).join(" · "),
    })),
    ...prontuario.senhas.map((s) => ({
      id: `s-${s.id}`,
      quando: s.criado_em,
      titulo: `Senha ${s.senha} · ${rotular("situacaoDaSenha", s.situacao)}`,
      detalhe: s.servico || "Serviço não informado",
    })),
  ].sort((a, b) => b.quando.localeCompare(a.quando));

  const rendaPorPessoa = socio.renda_total != null && socio.quantidade_pessoas_residencia
    ? socio.renda_total / socio.quantidade_pessoas_residencia
    : null;

  return (
    <AppShell>
      <PageHeader
        title={cidadao.nome}
        description={[
          faixaEtaria(cidadao.nascimento),
          rotular("sexo", cidadao.sexo),
          cidadao.cpf ? `CPF ${formatCPF(cidadao.cpf)}` : null,
        ].filter(Boolean).join(" · ")}
      />

      {(cidadao.tem_deficiencia || cidadao.acao_itinerante || cidadao.imagem_revogada_em) && (
        <div className="mb-5 flex flex-wrap gap-2">
          {cidadao.tem_deficiencia && <Badge tone="neutral">Pessoa com deficiência</Badge>}
          {cidadao.acao_itinerante && <Badge tone="neutral">Cadastrado em ação itinerante</Badge>}
          {cidadao.imagem_revogada_em && <Badge tone="bad">Uso de imagem revogado</Badge>}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Resumo rotulo={emAberto.length === 1 ? "Caso em aberto" : "Casos em aberto"} valor={emAberto.length} icone={ClipboardList} alerta={emAberto.length > 0} />
        <Resumo rotulo={beneficios.length === 1 ? "Benefício" : "Benefícios"} valor={beneficios.length} icone={Gift} />
        <Resumo rotulo={encaminhamentos.length === 1 ? "Encaminhamento" : "Encaminhamentos"} valor={encaminhamentos.length} icone={Send} />
        <Resumo rotulo="Pessoas na família" valor={familia.length} icone={Users} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <div className="grid gap-5">
          <Secao titulo="Identificação" icone={IdCard}>
            <Campo rotulo="Nome" valor={cidadao.nome} largo />
            <Campo rotulo="CPF" valor={cidadao.cpf ? formatCPF(cidadao.cpf) : null} />
            <Campo rotulo="NIS" valor={formatarNIS(cidadao.nis)} />
            <Campo rotulo="RG" valor={cidadao.rg} />
            <Campo
              rotulo="Nascimento"
              valor={cidadao.nascimento
                ? `${formatDateOnly(cidadao.nascimento)} (${faixaEtaria(cidadao.nascimento)})`
                : null}
            />
            <Campo rotulo="Sexo" valor={rotular("sexo", cidadao.sexo)} />
            <Campo rotulo="Identidade de gênero" valor={rotular("identidade", cidadao.identidade_de_genero)} />
            <Campo rotulo="Raça/cor" valor={rotular("raca", cidadao.raca)} />
            <Campo rotulo="Estado civil" valor={rotular("estadoCivil", cidadao.estado_civil)} />
            <Campo rotulo="Escolaridade" valor={rotular("escolaridade", cidadao.escolaridade)} />
            <Campo rotulo="Naturalidade" valor={cidadao.naturalidade} />
            <Campo rotulo="Deficiência" valor={simNao(cidadao.tem_deficiencia)} />
          </Secao>

          <Secao titulo="Contato" icone={Phone}>
            <Campo rotulo="Telefone" valor={formatarTelefone(cidadao.telefone)} />
            <Campo rotulo="E-mail" valor={cidadao.email} largo />
          </Secao>

          <Secao titulo="Endereço e moradia" icone={Home}>
            <Campo rotulo="Logradouro" valor={cidadao.endereco} largo />
            <Campo rotulo="Bairro" valor={cidadao.bairro} />
            <Campo
              rotulo="Município/UF"
              valor={[cidadao.cidade, cidadao.uf].filter(Boolean).join("/") || null}
            />
            <Campo rotulo="CEP" valor={formatarCEP(cidadao.cep)} />
            <Campo rotulo="Localização" valor={rotular("zona", moradia.tipo_localizacao)} />
            <Campo rotulo="Situação do imóvel" valor={rotular("moradia", moradia.situacao_imovel)} />
            <Campo rotulo="Abastecimento de água" valor={rotular("abastecimento", moradia.abastecimento_agua)} />
            <Campo rotulo="Saneamento" valor={simNao(moradia.possui_saneamento)} />
          </Secao>

          <Secao titulo="Perfil socioeconômico" icone={Wallet}>
            <Campo rotulo="Renda familiar" valor={formatarDinheiro(socio.renda_total)} />
            <Campo rotulo="Renda por pessoa" valor={formatarDinheiro(rendaPorPessoa)} />
            <Campo
              rotulo="Pessoas no domicílio"
              valor={socio.quantidade_pessoas_residencia ? String(socio.quantidade_pessoas_residencia) : null}
            />
            <Campo rotulo="Origem da renda" valor={rotular("origemDaRenda", socio.precedencia_rendimento)} />
            <Campo rotulo="Recebe benefício" valor={simNao(socio.recebe_beneficio)} />
            <Campo rotulo="Gestante na família" valor={simNao(socio.ha_gestante)} />
            <Campo rotulo="Pessoa com deficiência na família" valor={simNao(socio.ha_pessoa_com_deficiencia)} largo />
            <Campo
              rotulo="Benefícios recebidos"
              largo
              valor={socio.beneficios_recebidos?.length
                ? socio.beneficios_recebidos.map((b) => {
                  const nome = b.beneficio_nome || rotular("beneficio", b.beneficio_tipo) || "Benefício";
                  const valor = formatarDinheiro(b.beneficio_valor);
                  return valor ? `${nome} (${valor})` : nome;
                }).join(", ")
                : null}
            />
            <Campo
              rotulo="Serviços que acompanham a família"
              largo
              valor={socio.servicos_sociais?.length ? socio.servicos_sociais.join(", ") : null}
            />
            {socio.observacoes_gerais && <Campo rotulo="Observações do cadastro" valor={socio.observacoes_gerais} largo />}
          </Secao>

          <Secao titulo="Composição familiar" icone={Users} contagem={familia.length}>
            {familia.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground">
                Nenhum membro registrado no cadastro.
              </p>
            ) : (
              <div className="tabela-responsiva col-span-full">
                <table className="table">
                  <thead>
                    <tr><th>Nome</th><th>Parentesco</th><th>CPF</th><th>Nascimento</th><th>Escolaridade</th></tr>
                  </thead>
                  <tbody>
                    {familia.map((membro, i) => (
                      <tr key={`${membro.nome_membro}-${i}`}>
                        <td data-papel="titulo">{membro.nome_membro ?? "—"}</td>
                        <td data-rotulo="Parentesco">{rotular("parentesco", membro.parentesco) ?? "—"}</td>
                        <td data-rotulo="CPF">
                          {membro.nao_possui_cpf ? "Não possui" : membro.cpf_membro ? formatCPF(membro.cpf_membro) : "—"}
                        </td>
                        <td data-rotulo="Nascimento">{membro.data_nascimento ? formatDateOnly(membro.data_nascimento) : "—"}</td>
                        <td data-rotulo="Escolaridade">{rotular("escolaridade", membro.escolaridade) ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Secao>

          {cidadao.observacoes && (
            <Secao titulo="Observações" icone={FileText}>
              <p className="col-span-full whitespace-pre-line text-sm leading-6 text-foreground">
                {cidadao.observacoes}
              </p>
            </Secao>
          )}
        </div>

        <div className="grid gap-5 self-start">
          <SecaoLgpd cidadao={cidadao} />

          <Secao
            titulo="Benefícios eventuais"
            icone={Gift}
            contagem={beneficios.length}
            acao={<BotaoRegistrar aberto={registrando === "beneficio"} onAlternar={() => setRegistrando((r) => r === "beneficio" ? null : "beneficio")} />}
          >
            <RegistrarBeneficio
              cidadao={cidadao}
              aberto={registrando === "beneficio"}
              onFechar={() => setRegistrando(null)}
              onSalvo={recarregar}
            />
            <Lista
              vazio="Os benefícios concedidos a esta pessoa aparecem aqui."
              itens={beneficios.map((b) => ({
                id: b.id,
                titulo: `${b.tipo_outro || b.tipo_rotulo || b.tipo} · ${b.nome_da_pessoa}`,
                detalhe: [b.unidade_nome, b.registrado_por_nome, formatDate(b.criado_em)].filter(Boolean).join(" · "),
                texto: b.descricao,
              }))}
            />
          </Secao>

          <Secao
            titulo="Encaminhamentos"
            icone={Send}
            contagem={encaminhamentos.length}
            acao={<BotaoRegistrar aberto={registrando === "encaminhamento"} onAlternar={() => setRegistrando((r) => r === "encaminhamento" ? null : "encaminhamento")} />}
          >
            <RegistrarEncaminhamento
              cidadao={cidadao}
              casos={casos}
              unidades={unidades}
              aberto={registrando === "encaminhamento"}
              onFechar={() => setRegistrando(null)}
              onSalvo={recarregar}
            />
            <Lista
              vazio="Os encaminhamentos para a rede ou para fora dela aparecem aqui."
              itens={encaminhamentos.map((e) => ({
                id: e.id,
                titulo: `${e.unidade_destino_nome || e.destino_externo} · ${rotular("situacaoDoEncaminhamento", e.situacao)}`,
                detalhe: [e.encaminhado_por_nome, formatDate(e.criado_em)].filter(Boolean).join(" · "),
                texto: e.motivo,
              }))}
            />
          </Secao>

          <Secao titulo="Acompanhamentos" icone={ClipboardList} contagem={casos.length}>
            {casos.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground">
                Esta pessoa ainda não tem caso registrado.
              </p>
            ) : (
              <ul className="col-span-full grid gap-3">
                {casos.slice(0, 8).map((caso) => (
                  <li key={caso.id} className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <LinkDoCaso protocolo={caso.protocolo} className="text-sm font-semibold" />
                      <Badge tone={tomDaSituacaoDoCaso(caso.situacao)}>
                        {rotuloDaSituacaoDoCaso(caso.situacao)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[caso.servico_nome, caso.unidade_nome, formatDate(caso.aberto_em)].filter(Boolean).join(" · ")}
                    </p>
                    {caso.acao_itinerante_titulo && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ação itinerante: {caso.acao_itinerante_titulo}
                        {caso.acao_itinerante_local ? ` (${caso.acao_itinerante_local})` : ""}
                      </p>
                    )}
                  </li>
                ))}
                {casos.length > 8 && (
                  <li className="text-xs text-muted-foreground">e mais {casos.length - 8}…</li>
                )}
              </ul>
            )}
          </Secao>

          <Secao titulo="Atendimentos e fila" icone={Stethoscope} contagem={passagens.length}>
            <Lista
              vazio="As passagens pela recepção e as senhas desta pessoa aparecem aqui."
              itens={passagens.slice(0, 10).map((p) => ({
                id: p.id, titulo: p.titulo, detalhe: [p.detalhe, formatDate(p.quando)].filter(Boolean).join(" · "),
              }))}
            />
          </Secao>

          <Secao titulo="Anexos" icone={Paperclip} contagem={anexos.length}>
            {anexos.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground">Nenhum documento anexado.</p>
            ) : (
              <ul className="col-span-full grid gap-2">
                {anexos.map((anexo, i) => (
                  <li key={anexo.id ?? i} className="flex items-center gap-2 text-sm text-foreground">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    {descreverAnexo(anexo)}
                  </li>
                ))}
              </ul>
            )}
          </Secao>

          <Secao titulo="Histórico municipal" icone={CalendarClock} contagem={historico.length}>
            {historico.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground">
                Os atendimentos desta pessoa em qualquer unidade aparecem aqui.
              </p>
            ) : (
              <ol className="col-span-full grid gap-3">
                {historico.map((entrada, i) => (
                  <li key={`${entrada.quando}-${i}`} className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-foreground">{entrada.o_que}</strong>
                      {entrada.no_mes_corrente && <Badge tone="warn">Mês corrente</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entrada.unidade} · {formatDate(entrada.quando)}
                      {entrada.quem_atendeu ? ` · ${entrada.quem_atendeu}` : ""}
                    </p>
                    {entrada.detalhe && (
                      <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-muted-foreground">{entrada.detalhe}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Secao>

          <Secao titulo="Registro" icone={BadgeCheck}>
            <Campo rotulo="Cadastrado em" valor={cidadao.criado_em ? formatDate(cidadao.criado_em) : null} />
            <Campo rotulo="Atualizado em" valor={cidadao.atualizado_em ? formatDate(cidadao.atualizado_em) : null} />
          </Secao>
        </div>
      </div>
    </AppShell>
  );
}

/**
 * Consentimentos, e as duas saídas de dado pessoal: a impressão e a exportação.
 *
 * As duas ficam aqui, junto dos consentimentos, e não no cabeçalho: tirar o
 * prontuário de dentro do sistema é decisão de LGPD — as duas entram na trilha
 * de auditoria como `EXPORT`.
 */
function SecaoLgpd({ cidadao }: { cidadao: Cidadao }) {
  return (
    <Secao titulo="Privacidade e LGPD" icone={ShieldCheck}>
      <Campo
        rotulo="Uso de imagem"
        valor={cidadao.imagem_revogada_em
          ? `Revogado em ${formatDate(cidadao.imagem_revogada_em)}`
          : cidadao.autoriza_imagem
            ? cidadao.imagem_aceita_em ? `Autorizado em ${formatDate(cidadao.imagem_aceita_em)}` : "Autorizado"
            : "Não autorizado"}
        largo
      />
      <Campo
        rotulo="Tefé Cidadão"
        valor={cidadao.consentiu_tefe_cidadao_em
          ? `Consentiu em ${formatDate(cidadao.consentiu_tefe_cidadao_em)}`
          : "Sem consentimento registrado"}
        largo
      />
      <div className="col-span-full flex flex-wrap gap-2 pt-1">
        <a className="button gap-2" href={urlDaApi(`/citizens/${cidadao.id}/imprimir`)} target="_blank" rel="noreferrer">
          <Printer size={16} aria-hidden="true" />
          Imprimir prontuário
        </a>
        <a className="button secondary gap-2" href={urlDaApi(`/citizens/${cidadao.id}/exportar`)} target="_blank" rel="noreferrer">
          <Download size={16} aria-hidden="true" />
          Exportar dados (LGPD)
        </a>
      </div>
    </Secao>
  );
}

function Resumo({
  rotulo, valor, icone: Icone, alerta = false,
}: {
  rotulo: string;
  valor: number;
  icone: React.ElementType;
  alerta?: boolean;
}) {
  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between gap-3">
        <span className={`text-2xl font-semibold ${alerta ? "text-[var(--pmt-color-warning-soft-fg)]" : "text-foreground"}`}>
          {valor}
        </span>
        <Icone className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{rotulo}</p>
    </Card>
  );
}

function Lista({
  itens, vazio,
}: {
  itens: { id: string; titulo: string; detalhe?: string | null; texto?: string | null }[];
  vazio: string;
}) {
  if (itens.length === 0) {
    return <p className="col-span-full text-sm text-muted-foreground">{vazio}</p>;
  }
  return (
    <ul className="col-span-full grid gap-3">
      {itens.map((item) => (
        <li key={item.id} className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0">
          <strong className="block text-sm text-foreground">{item.titulo}</strong>
          {item.detalhe && <p className="mt-1 text-xs text-muted-foreground">{item.detalhe}</p>}
          {item.texto && <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.texto}</p>}
        </li>
      ))}
    </ul>
  );
}

/**
 * O que dizer de um anexo.
 *
 * A API grava `tipo_documento` (texto livre, `outro` quando não informado),
 * `mime` e `tamanho` — não há nome de arquivo.
 */
function descreverAnexo(anexo: { tipo_documento?: string; mime?: string; tamanho?: number }): string {
  const tipo = anexo.tipo_documento && anexo.tipo_documento !== "outro"
    ? anexo.tipo_documento.charAt(0).toUpperCase() + anexo.tipo_documento.slice(1)
    : "Documento";
  const formato = anexo.mime === "application/pdf" ? "PDF" : anexo.mime?.startsWith("image/") ? "imagem" : null;
  const tamanho = anexo.tamanho ? `${Math.max(1, Math.round(anexo.tamanho / 1024))} KB` : null;
  const detalhe = [formato, tamanho].filter(Boolean).join(", ");
  return detalhe ? `${tipo} (${detalhe})` : tipo;
}

function simNao(valor?: boolean | null): string | null {
  if (valor === null || valor === undefined) return null;
  return valor ? "Sim" : "Não";
}

function Secao({
  titulo, icone: Icone, contagem, acao, children,
}: {
  titulo: string;
  icone: React.ElementType;
  contagem?: number;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="!mb-0 inline-flex items-center gap-2 text-base">
          <Icone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {titulo}
        </h2>
        <div className="flex items-center gap-2">
          {contagem !== undefined && contagem > 0 && <Badge tone="neutral">{contagem}</Badge>}
          {acao}
        </div>
      </div>
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

/**
 * Um par rótulo/valor.
 *
 * Campo sem valor continua aparecendo, com um traço. Sumir com ele deixaria a
 * ficha com buracos irregulares e, pior, esconderia que o dado **falta** — numa
 * ficha de assistência social, "não informado" é informação: é o que diz à
 * próxima pessoa o que ainda precisa ser perguntado.
 */
function Campo({
  rotulo, valor, largo = false,
}: {
  rotulo: string;
  valor?: string | null;
  largo?: boolean;
}) {
  return (
    <div className={largo ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {rotulo}
      </dt>
      <dd className={`mt-1 text-sm leading-6 ${valor ? "text-foreground" : "text-muted-foreground/60"}`}>
        {valor || "Não informado"}
      </dd>
    </div>
  );
}
