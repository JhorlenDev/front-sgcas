"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Headset, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import type { Caso, Senha } from "@/types/sgcas";

export default function DashboardPage() {
  const [fila, setFila] = useState<Senha[]>([]);
  const [casos, setCasos] = useState<Caso[]>([]);

  useEffect(() => {
    void Promise.all([
      api<Senha[]>("/queues/").then(setFila).catch(() => setFila([])),
      api<Caso[]>("/cases/").then(setCasos).catch(() => setCasos([])),
    ]);
  }, []);

  return (
    <AppShell>
      <PageHeader title="Painel" description="Resumo operacional da unidade para comecar o atendimento." />

      <div className="grid three dashboard-stats">
        <StatCard title="Na fila" value={fila.length} icon={Users} hero />
        <StatCard title="Casos em acompanhamento" value={casos.length} icon={FolderOpen} />
        <Card className="stat action-stat">
          <span>Atalho rapido</span>
          <Headset size={28} />
          <Link href="/recepcao">
            <Button>Registrar recepcao</Button>
          </Link>
        </Card>
      </div>

      <div style={{ height: 16 }} />

      <div className="grid two dashboard-lists">
        <Card>
          <h2>Fila de atendimento</h2>
          {fila.length === 0 ? (
            <EmptyState title="Fila vazia" text="Quando a recepcao encaminhar alguem, a senha aparece aqui." />
          ) : (
            fila.slice(0, 6).map((senha) => (
              <div className="row line-row" key={senha.id}>
                <span>{senha.senha} - {senha.cidadao_nome}</span>
                <small>{senha.servico}</small>
              </div>
            ))
          )}
        </Card>
        <Card>
          <h2>Casos recentes</h2>
          {casos.length === 0 ? (
            <EmptyState title="Sem casos" text="Os atendimentos encaminhados aparecem nesta lista." />
          ) : (
            casos.slice(0, 6).map((caso) => (
              <div className="row line-row" key={caso.id}>
                <span>{caso.cidadao_nome}</span>
                <small>{caso.situacao}</small>
              </div>
            ))
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  hero = false,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  hero?: boolean;
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
      <small>{hero ? "Atendimentos aguardando chamada." : "Casos visiveis para sua unidade."}</small>
    </Card>
  );
}
