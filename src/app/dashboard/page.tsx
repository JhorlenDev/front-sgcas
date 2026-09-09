"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Headset, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { api, comQuery } from "@/lib/api";
import type { Caso, Paginado, ResumoDeCasos, Senha } from "@/types/sgcas";

export default function DashboardPage() {
  const [fila, setFila] = useState<Paginado<Senha> | null>(null);
  const [casos, setCasos] = useState<Paginado<Caso> | null>(null);
  const [resumo, setResumo] = useState<ResumoDeCasos | null>(null);

  useEffect(() => {
    // Os números dos cartões vêm de `total` e de `/cases/resumo`, contados no
    // banco. Contar o array recebido diria quantos itens couberam nesta página
    // — que numa base municipal é o tamanho da página, não o da rede.
    void Promise.all([
      api<Paginado<Senha>>(comQuery("/queues/", { limit: 6 })).then(setFila).catch(() => setFila(null)),
      api<Paginado<Caso>>(comQuery("/cases/", { limit: 6 })).then(setCasos).catch(() => setCasos(null)),
      api<ResumoDeCasos>("/cases/resumo").then(setResumo).catch(() => setResumo(null)),
    ]);
  }, []);

  const senhas = fila?.itens ?? [];
  const recentes = casos?.itens ?? [];

  return (
    <AppShell>
      <PageHeader title="Painel" description="Resumo operacional da unidade para começar o atendimento." />

      <div className="grid three dashboard-stats">
        <StatCard
          title="Na fila"
          value={fila?.total ?? 0}
          icon={Users}
          hero
          nota="Atendimentos aguardando chamada."
        />
        <StatCard
          title="Casos em acompanhamento"
          value={resumo?.em_acompanhamento ?? 0}
          icon={FolderOpen}
          nota={
            resumo
              ? `Em triagem ou em atendimento, de ${resumo.total.toLocaleString("pt-BR")} casos na sua unidade.`
              : "Casos visíveis para sua unidade."
          }
        />
        <Card className="stat action-stat">
          <span>Atalho rápido</span>
          <Headset size={28} />
          <Link href="/recepcao">
            <Button>Registrar recepção</Button>
          </Link>
        </Card>
      </div>

      <div style={{ height: 16 }} />

      <div className="grid two dashboard-lists">
        <Card>
          <h2>Fila de atendimento</h2>
          {senhas.length === 0 ? (
            <EmptyState title="Fila vazia" text="Quando a recepção encaminhar alguém, a senha aparece aqui." />
          ) : (
            <>
              {senhas.map((senha) => (
                <div className="row line-row" key={senha.id}>
                  <span>{senha.senha} - {senha.cidadao_nome}</span>
                  <small>{senha.servico}</small>
                </div>
              ))}
              <RodapeDaLista
                mostrando={senhas.length}
                total={fila?.total ?? 0}
                href="/fila"
                rotulo="a fila completa"
              />
            </>
          )}
        </Card>
        <Card>
          <h2>Casos recentes</h2>
          {recentes.length === 0 ? (
            <EmptyState title="Sem casos" text="Os atendimentos encaminhados aparecem nesta lista." />
          ) : (
            <>
              {recentes.map((caso) => (
                <div className="row line-row" key={caso.id}>
                  <span>{caso.cidadao_nome}</span>
                  <small>{caso.situacao}</small>
                </div>
              ))}
              <RodapeDaLista
                mostrando={recentes.length}
                total={casos?.total ?? 0}
                href="/casos"
                rotulo="todos os acompanhamentos"
              />
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

/**
 * Diz que a lista está recortada e para onde ir ver o resto.
 *
 * Sem isso o painel mostra seis linhas sem sinal de que existem outras — que é
 * como o número truncado passava despercebido.
 */
function RodapeDaLista({
  mostrando,
  total,
  href,
  rotulo,
}: {
  mostrando: number;
  total: number;
  href: string;
  rotulo: string;
}) {
  if (total <= mostrando) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
      <small className="text-muted-foreground">
        Mostrando {mostrando} de {total.toLocaleString("pt-BR")}
      </small>
      <Link href={href} className="text-xs font-semibold text-primary hover:underline">
        Ver {rotulo}
      </Link>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  hero = false,
  nota,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  hero?: boolean;
  nota: string;
}) {
  return (
    <Card className={`stat ${hero ? "hero-stat" : ""}`}>
      <div className="stat-head">
        <span>{title}</span>
        <div className="stat-icon">
          <Icon size={21} />
        </div>
      </div>
      <strong>{value.toLocaleString("pt-BR")}</strong>
      <small>{nota}</small>
    </Card>
  );
}
