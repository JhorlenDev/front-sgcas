"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeCheck, CalendarClock, ClipboardList, FileText, IdCard,
  MapPin, Paperclip, Phone, ShieldCheck, Users, Wallet,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LinkDoCaso } from "@/components/shared/links";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { api, comQuery } from "@/lib/api";
import {
  faixaEtaria, formatarCEP, formatarDinheiro, formatarNIS, formatarTelefone, rotular,
} from "@/lib/rotulos";
import { formatCPF, formatDate, formatDateOnly } from "@/lib/utils";
import type { Caso, Cidadao, EntradaHistorico, Paginado } from "@/types/sgcas";

export default function ProntuarioPage() {
  const params = useParams<{ id: string }>();
  const [cidadao, setCidadao] = useState<Cidadao | null>(null);
  const [historico, setHistorico] = useState<EntradaHistorico[]>([]);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    void api<Cidadao>(`/citizens/${params.id}`)
      .then(setCidadao)
      .catch(() => setErro("Não foi possível abrir este prontuário."));

    void api<{ entradas: EntradaHistorico[] }>(`/citizens/${params.id}/historico`)
      .then((data) => setHistorico(data.entradas))
      .catch(() => setHistorico([]));

    void api<Paginado<Caso>>(comQuery("/cases/", { cidadao: params.id, limit: 50 }))
      .then((data) => setCasos(data.itens))
      .catch(() => setCasos([]));
  }, [params.id]);

  if (erro) {
    return (
      <AppShell>
        <PageHeader title="Prontuário" description="" />
        <EmptyState title="Sem acesso" text={erro} />
      </AppShell>
    );
  }

  const socio = cidadao?.socioeconomico ?? null;
  const endereco = cidadao?.endereco_detalhado ?? null;
  const familia = cidadao?.membros_da_familia ?? [];
  const anexos = cidadao?.anexos ?? [];
  const emAberto = casos.filter((c) => ["EM_TRIAGEM", "EM_ATENDIMENTO"].includes(c.situacao));

  return (
    <AppShell>
      <PageHeader
        title={cidadao?.nome ?? "Prontuário"}
        description={
          cidadao
            ? [
                faixaEtaria(cidadao.nascimento),
                rotular("sexo", cidadao.sexo),
                cidadao.cpf ? `CPF ${formatCPF(cidadao.cpf)}` : null,
              ].filter(Boolean).join(" · ")
            : "Carregando…"
        }
      />

      {cidadao && (
        <div className="mb-5 flex flex-wrap gap-2">
          {emAberto.length > 0 && (
            <Badge tone="warn">
              {emAberto.length === 1 ? "1 caso em aberto" : `${emAberto.length} casos em aberto`}
            </Badge>
          )}
          {cidadao.tem_deficiencia && <Badge tone="neutral">Pessoa com deficiência</Badge>}
          {cidadao.acao_itinerante && <Badge tone="neutral">Cadastrado em ação itinerante</Badge>}
          {cidadao.imagem_revogada_em && <Badge tone="bad">Uso de imagem revogado</Badge>}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <div className="grid gap-5">
          <Secao titulo="Identificação" icone={IdCard}>
            <Campo rotulo="Nome" valor={cidadao?.nome} largo />
            <Campo rotulo="CPF" valor={cidadao?.cpf ? formatCPF(cidadao.cpf) : null} />
            <Campo rotulo="NIS" valor={formatarNIS(cidadao?.nis)} />
            <Campo rotulo="RG" valor={cidadao?.rg} />
            <Campo
              rotulo="Nascimento"
              valor={cidadao?.nascimento
                ? `${formatDateOnly(cidadao.nascimento)} (${faixaEtaria(cidadao.nascimento)})`
                : null}
            />
            <Campo rotulo="Sexo" valor={rotular("sexo", cidadao?.sexo)} />
            <Campo rotulo="Identidade de gênero" valor={rotular("identidade", cidadao?.identidade_de_genero)} />
            <Campo rotulo="Raça/cor" valor={rotular("raca", cidadao?.raca)} />
            <Campo rotulo="Estado civil" valor={rotular("estadoCivil", cidadao?.estado_civil)} />
            <Campo rotulo="Escolaridade" valor={rotular("escolaridade", cidadao?.escolaridade)} />
            <Campo rotulo="Naturalidade" valor={cidadao?.naturalidade} />
            <Campo
              rotulo="Deficiência"
              valor={cidadao?.tem_deficiencia === null || cidadao?.tem_deficiencia === undefined
                ? null
                : cidadao.tem_deficiencia ? "Sim" : "Não"}
            />
          </Secao>

          <Secao titulo="Contato" icone={Phone}>
            <Campo rotulo="Telefone" valor={formatarTelefone(cidadao?.telefone)} />
            <Campo rotulo="E-mail" valor={cidadao?.email} largo />
          </Secao>

          <Secao titulo="Endereço" icone={MapPin}>
            <Campo rotulo="Logradouro" valor={cidadao?.endereco} largo />
            <Campo rotulo="Bairro" valor={cidadao?.bairro} />
            <Campo
              rotulo="Município/UF"
              valor={[cidadao?.cidade, cidadao?.uf].filter(Boolean).join("/") || null}
            />
            <Campo rotulo="CEP" valor={formatarCEP(cidadao?.cep)} />
            <Campo rotulo="Zona" valor={rotular("zona", endereco?.zona)} />
            <Campo rotulo="Ponto de referência" valor={endereco?.referencia} largo />
          </Secao>

          <Secao titulo="Perfil socioeconômico" icone={Wallet}>
            <Campo rotulo="Renda familiar" valor={formatarDinheiro(socio?.rendaFamiliar)} />
            <Campo rotulo="Renda por pessoa" valor={formatarDinheiro(socio?.rendaPerCapita)} />
            <Campo
              rotulo="Pessoas no domicílio"
              valor={socio?.pessoasNoDomicilio ? String(socio.pessoasNoDomicilio) : null}
            />
            <Campo rotulo="Moradia" valor={rotular("moradia", socio?.situacaoMoradia)} />
            <Campo rotulo="Construção" valor={rotular("construcao", socio?.tipoConstrucao)} />
            <Campo rotulo="Água encanada" valor={simNao(socio?.aguaEncanada)} />
            <Campo rotulo="Energia elétrica" valor={simNao(socio?.energiaEletrica)} />
            <Campo rotulo="Coleta de lixo" valor={simNao(socio?.coletaDeLixo)} />
            <Campo
              rotulo="Benefícios"
              largo
              valor={socio?.beneficios?.length
                ? socio.beneficios.map((b) => rotular("beneficio", b)).join(", ")
                : null}
            />
          </Secao>

          <Secao titulo="Composição familiar" icone={Users} contagem={familia.length}>
            {familia.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground">
                Nenhum membro registrado no cadastro.
              </p>
            ) : (
              <div className="col-span-full overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr><th>Nome</th><th>Parentesco</th><th>Nascimento</th></tr>
                  </thead>
                  <tbody>
                    {familia.map((membro, i) => (
                      <tr key={`${membro.nome}-${i}`}>
                        <td>{membro.nome ?? "—"}</td>
                        <td>{rotular("parentesco", membro.parentesco) ?? "—"}</td>
                        <td>{membro.nascimento ? formatDateOnly(membro.nascimento) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Secao>

          {cidadao?.observacoes && (
            <Secao titulo="Observações" icone={FileText}>
              <p className="col-span-full whitespace-pre-line text-sm leading-6 text-foreground">
                {cidadao.observacoes}
              </p>
            </Secao>
          )}
        </div>

        <div className="grid gap-5 self-start">
          <Secao titulo="Consentimentos (LGPD)" icone={ShieldCheck}>
            <Campo
              rotulo="Uso de imagem"
              valor={cidadao?.imagem_revogada_em
                ? `Revogado em ${formatDate(cidadao.imagem_revogada_em)}`
                : cidadao?.autoriza_imagem
                  ? cidadao.imagem_aceita_em
                    ? `Autorizado em ${formatDate(cidadao.imagem_aceita_em)}`
                    : "Autorizado"
                  : "Não autorizado"}
              largo
            />
            <Campo
              rotulo="Tefé Cidadão"
              valor={cidadao?.consentiu_tefe_cidadao_em
                ? `Consentiu em ${formatDate(cidadao.consentiu_tefe_cidadao_em)}`
                : "Sem consentimento registrado"}
              largo
            />
          </Secao>

          <Secao titulo="Anexos" icone={Paperclip} contagem={anexos.length}>
            {anexos.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground">
                Nenhum documento anexado.
              </p>
            ) : (
              <ul className="col-span-full grid gap-2">
                {anexos.map((anexo, i) => (
                  <li key={anexo.id ?? i} className="flex items-center gap-2 text-sm text-foreground">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {anexo.nome ?? "Documento"}
                  </li>
                ))}
              </ul>
            )}
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
                      <Badge tone={caso.situacao === "CONCLUIDO" ? "good" : "warn"}>
                        {caso.situacao.replace(/_/g, " ").toLowerCase()}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {caso.unidade_nome} · {formatDate(caso.aberto_em)}
                    </p>
                  </li>
                ))}
                {casos.length > 8 && (
                  <li className="text-xs text-muted-foreground">
                    e mais {casos.length - 8}…
                  </li>
                )}
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
                      <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {entrada.detalhe}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Secao>

          <Secao titulo="Registro" icone={BadgeCheck}>
            <Campo rotulo="Cadastrado em" valor={cidadao?.criado_em ? formatDate(cidadao.criado_em) : null} />
            <Campo rotulo="Atualizado em" valor={cidadao?.atualizado_em ? formatDate(cidadao.atualizado_em) : null} />
          </Secao>
        </div>
      </div>
    </AppShell>
  );
}

function simNao(valor?: boolean | null): string | null {
  if (valor === null || valor === undefined) return null;
  return valor ? "Sim" : "Não";
}

function Secao({
  titulo, icone: Icone, contagem, children,
}: {
  titulo: string;
  icone: React.ElementType;
  contagem?: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="!mb-0 inline-flex items-center gap-2 text-base">
          <Icone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {titulo}
        </h2>
        {contagem !== undefined && contagem > 0 && <Badge tone="neutral">{contagem}</Badge>}
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
