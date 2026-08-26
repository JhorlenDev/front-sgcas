"use client";

import { CalendarDays, MapPinned, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export default function AcoesItinerantesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Ações itinerantes"
        description="Área reservada para atendimentos fora da sede, em comunidades, distritos e ações externas."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="!p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-meta-slate">Planejamento</p>
              <strong className="mt-2 block text-xl text-meta-charcoal">Agenda de ações</strong>
              <small className="mt-1 block text-meta-slate">Datas, locais e responsáveis.</small>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-primary/10 text-primary">
              <CalendarDays size={18} />
            </span>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-meta-slate">Campo</p>
              <strong className="mt-2 block text-xl text-meta-charcoal">Atendimento externo</strong>
              <small className="mt-1 block text-meta-slate">Cadastros, casos e benefícios na ação.</small>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-warning/20 text-[#8a5a00]">
              <MapPinned size={18} />
            </span>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-meta-slate">Balanço</p>
              <strong className="mt-2 block text-xl text-meta-charcoal">Participantes</strong>
              <small className="mt-1 block text-meta-slate">Resumo para prestação de contas.</small>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-success/10 text-success">
              <UsersRound size={18} />
            </span>
          </div>
        </Card>
      </div>

      <div style={{ height: 16 }} />

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="!mb-0">Módulo em construção</h2>
          <Badge tone="warn">Placeholder</Badge>
        </div>
        <EmptyState
          title="Pronto para implementação"
          text="A aba já está criada e protegida por perfil. A funcionalidade real pode ser plugada aqui depois."
        />
      </Card>
    </AppShell>
  );
}
