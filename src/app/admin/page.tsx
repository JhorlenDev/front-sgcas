"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card, Checkbox, Dropdown, EmptyState, Field, Input, PageHeader } from "@/components/ui";
import { Paginacao } from "@/components/shared/paginacao";
import { api, comQuery, paginadoVazio } from "@/lib/api";
import type { Operador, Paginado, Papel, Unidade } from "@/types/sgcas";

type Pedido = {
  id: string;
  nome: string;
  email: string;
  situacao: string;
  pedido_em: string;
};

const papeis: Array<{ value: Papel; label: string; hint: string }> = [
  { value: "RECEPCIONISTA", label: "Recepcionista", hint: "Balcão, busca cidadão e gera senha." },
  { value: "TECNICO", label: "Técnico", hint: "Chama fila e registra atendimento." },
  { value: "ASSISTENTE_SOCIAL", label: "Assistente social", hint: "Atendimento técnico/social." },
  { value: "COORDENADOR", label: "Coordenador", hint: "Acompanha unidade e equipe." },
  { value: "GESTOR_ACOES_ITINERANTES", label: "Gestor de ações", hint: "Ações itinerantes em campo." },
  { value: "VISUALIZADOR", label: "Visualizador", hint: "Somente consulta." },
  { value: "ADMIN", label: "Administrador", hint: "Acesso total ao sistema." },
];

const POR_PAGINA = 25;

function UsuariosComBusca() {
  const parametros = useSearchParams();
  const [paginaDeOperadores, setPaginaDeOperadores] = useState<Paginado<Operador> | null>(null);
  const [numero, setNumero] = useState(1);
  // Chega preenchida quando alguém clicou no nome de um servidor em outra tela.
  const [buscaDeOperador, setBuscaDeOperador] = useState(() => parametros.get("busca") ?? "");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    const [users, requests, units] = await Promise.all([
      api<Paginado<Operador>>(
        comQuery("/users/", { page: numero, limit: POR_PAGINA, busca: buscaDeOperador }),
      ).catch(() => paginadoVazio<Operador>(POR_PAGINA)),
      api<Pedido[]>("/access-requests/").catch(() => []),
      api<Unidade[]>("/institutional/units").catch(() => []),
    ]);
    setPaginaDeOperadores(users);
    setPedidos(requests);
    setUnidades(units);
  }, [numero, buscaDeOperador]);

  const operadores = paginaDeOperadores?.itens ?? [];

  // A dica de cada papel vira a segunda linha da opção — no `<select>` nativo
  // ela não tinha onde caber e vivia solta embaixo do campo.
  const opcoesDePapel = useMemo(
    () => papeis.map((p) => ({ value: p.value, label: p.label, hint: p.hint })),
    [],
  );
  const opcoesDeUnidade = useMemo(
    () => [{ value: "", label: "Sem unidade" }, ...unidades.map((u) => ({ value: u.id, label: u.nome }))],
    [unidades],
  );

  useEffect(() => {
    // 350ms: a busca por nome é digitada, e cada tecla dispararia uma consulta.
    const timer = window.setTimeout(() => {
      void carregar();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [carregar]);

  useEffect(() => {
    if (!mensagem) return;
    const timer = window.setTimeout(() => setMensagem(""), 4500);
    return () => window.clearTimeout(timer);
  }, [mensagem]);

  // Os dois contadores de operador vêm de consultas próprias, com `total` do
  // banco: contar a página exibida diria quantos couberam nela, não quantos são.
  const [totais, setTotais] = useState({ ativos: 0, semUnidade: 0 });

  useEffect(() => {
    void Promise.all([
      api<Paginado<Operador>>(comQuery("/users/", { ativo: "true", limit: 1 })),
      api<Paginado<Operador>>(comQuery("/users/", { sem_unidade: "true", limit: 1 })),
    ])
      .then(([ativos, sem]) => setTotais({ ativos: ativos.total, semUnidade: sem.total }))
      .catch(() => setTotais({ ativos: 0, semUnidade: 0 }));
  }, [mensagem]);

  const resumo = useMemo(() => ({
    pendentes: pedidos.length,
    ativos: totais.ativos,
    semUnidade: totais.semUnidade,
  }), [pedidos, totais]);

  async function aprovar(event: FormEvent<HTMLFormElement>, pedido: Pedido) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(`/access-requests/${pedido.id}/aprovar`, {
        method: "POST",
        body: JSON.stringify({
          papel: form.get("papel"),
          unidade_id: form.get("unidade_id") || null,
        }),
      });
      setMensagem("Pedido aprovado. O usuário deve entrar novamente para receber o novo perfil.");
      await carregar();
    } catch {
      setMensagem("Não foi possível aprovar o pedido.");
    }
  }

  async function atualizarOperador(event: FormEvent<HTMLFormElement>, operador: Operador) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const novoPapel = form.get("papel");
    try {
      if (novoPapel && novoPapel !== operador.papel) {
        await api(`/users/${operador.id}/perfil`, {
          method: "PUT",
          body: JSON.stringify({ papel: novoPapel }),
        });
      }

      await api(`/users/${operador.id}/atualizar`, {
        method: "PUT",
        body: JSON.stringify({
          nome: form.get("nome"),
          unidade_id: form.get("unidade_id") || null,
          ativo: form.get("ativo") === "on",
        }),
      });
      setMensagem(novoPapel !== operador.papel ? "Perfil e operador atualizados. O usuário deve entrar novamente." : "Operador atualizado.");
      await carregar();
    } catch {
      setMensagem("Não foi possível atualizar operador.");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Usuários"
        description="Aprove solicitações, defina perfil, vincule unidade e acompanhe operadores cadastrados."
      />

      {mensagem && <div className="notice">{mensagem}</div>}
      <div style={{ height: 16 }} />

      <div className="grid gap-4 md:grid-cols-3">
        <ResumoCard title="Solicitações" value={resumo.pendentes} text="Aguardando aprovação" icon={Clock3} tone="warn" />
        <ResumoCard title="Operadores ativos" value={resumo.ativos} text="Com acesso liberado" icon={UsersRound} tone="good" />
        <ResumoCard title="Sem unidade" value={resumo.semUnidade} text="Precisam de lotação" icon={ShieldCheck} tone="bad" />
      </div>

      <div style={{ height: 16 }} />

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="!mb-1">Solicitações de acesso</h2>
              <p className="text-sm leading-6 text-muted-foreground">Escolha a role e a unidade antes de aprovar.</p>
            </div>
            <Badge tone={pedidos.length ? "warn" : "good"}>{pedidos.length}</Badge>
          </div>

          {pedidos.length === 0 ? (
            <EmptyState title="Sem solicitações" text="Quando alguém entrar sem role do SGCAS, aparece aqui." />
          ) : (
            <div className="space-y-3">
              {pedidos.map((pedido) => (
                <form
                  className="rounded-lg border border-border bg-background p-4"
                  key={pedido.id}
                  onSubmit={(event) => void aprovar(event, pedido)}
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-foreground">{pedido.nome}</strong>
                      <small className="block truncate text-xs text-muted-foreground">{pedido.email}</small>
                    </div>
                    <Badge tone="warn">{formatarDataCurta(pedido.pedido_em)}</Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Perfil">
                      <Dropdown name="papel" rotulo="Perfil" defaultValue="RECEPCIONISTA" opcoes={opcoesDePapel} />
                    </Field>
                    <Field label="Unidade">
                      <Dropdown name="unidade_id" rotulo="Unidade" defaultValue="" opcoes={opcoesDeUnidade} />
                    </Field>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Dica: recepcionista e técnico normalmente precisam estar vinculados a uma unidade.
                  </p>

                  <Button className="mt-3 h-9 px-4 text-xs">
                    <CheckCircle2 size={15} />
                    Aprovar acesso
                  </Button>
                </form>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="!mb-1">Operadores cadastrados</h2>
              <p className="text-sm leading-6 text-muted-foreground">Ajuste perfil, lotação e status. O perfil é atualizado no Keycloak.</p>
            </div>
            <Badge tone="neutral">{(paginaDeOperadores?.total ?? 0).toLocaleString("pt-BR")}</Badge>
          </div>

          <div className="mb-5">
            <Field label="Buscar operador">
              <Input
                type="search"
                placeholder="Nome ou e-mail"
                value={buscaDeOperador}
                onChange={(event) => {
                  setNumero(1);
                  setBuscaDeOperador(event.target.value);
                }}
              />
            </Field>
          </div>

          {operadores.length === 0 ? (
            <EmptyState title="Nenhum operador" text="Os usuários aprovados aparecem aqui." />
          ) : (
            <div className="space-y-3">
              {operadores.map((operador) => (
                <form
                  className="rounded-lg border border-border bg-white p-4"
                  key={operador.id}
                  onSubmit={(event) => void atualizarOperador(event, operador)}
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-foreground">{operador.nome || operador.email}</strong>
                      <small className="block truncate text-xs text-muted-foreground">{operador.email}</small>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={operador.ativo ? "good" : "bad"}>{operador.ativo ? "Ativo" : "Inativo"}</Badge>
                      <Badge tone="neutral">{rotuloPapel(operador.papel)}</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                    <Field label="Nome">
                      <Input name="nome" defaultValue={operador.nome} />
                    </Field>
                    <Field label="Perfil">
                      <Dropdown name="papel" rotulo="Perfil" defaultValue={operador.papel} opcoes={opcoesDePapel} />
                    </Field>
                    <Field label="Unidade">
                      <Dropdown
                        name="unidade_id"
                        rotulo="Unidade"
                        defaultValue={operador.unidade?.id ?? ""}
                        opcoes={opcoesDeUnidade}
                      />
                    </Field>
                    <div className="flex items-end">
                      <Checkbox name="ativo" defaultChecked={operador.ativo}>Ativo</Checkbox>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs leading-5 text-muted-foreground">{descricaoPapel(operador.papel)}</p>
                    <Button className="h-9 px-4 text-xs" type="submit">
                      <UserCog size={15} />
                      Salvar
                    </Button>
                  </div>
                </form>
              ))}
            </div>
          )}

          <Paginacao
            pagina={paginaDeOperadores?.pagina ?? 1}
            paginas={paginaDeOperadores?.paginas ?? 1}
            total={paginaDeOperadores?.total ?? 0}
            porPagina={paginaDeOperadores?.por_pagina ?? POR_PAGINA}
            onPagina={setNumero}
            rotulo="operadores"
          />
        </Card>
      </div>
    </AppShell>
  );
}

function ResumoCard({
  title,
  value,
  text,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  text: string;
  icon: React.ElementType;
  tone: "good" | "warn" | "bad";
}) {
  const toneClass = {
    good: "bg-success/10 text-success",
    warn: "bg-[var(--pmt-color-warning-soft)] text-[var(--pmt-color-warning-soft-fg)]",
    bad: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
          <strong className="mt-1.5 block text-2xl text-foreground">{value.toLocaleString("pt-BR")}</strong>
          <small className="mt-0.5 block text-xs text-muted-foreground">{text}</small>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${toneClass}`}>
          <Icon size={16} />
        </span>
      </div>
    </Card>
  );
}

function rotuloPapel(papel: Papel) {
  return papeis.find((item) => item.value === papel)?.label ?? papel;
}

function descricaoPapel(papel: Papel) {
  return papeis.find((item) => item.value === papel)?.hint ?? "Perfil do operador.";
}

function formatarDataCurta(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AppShell><EmptyState title="Carregando…" text="Preparando a gestão de acesso." /></AppShell>}>
      <UsuariosComBusca />
    </Suspense>
  );
}
