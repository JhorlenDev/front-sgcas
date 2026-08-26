"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import type { Cidadao, EntradaHistorico } from "@/types/sgcas";

export default function ProntuarioPage() {
  const params = useParams<{ id: string }>();
  const [cidadao, setCidadao] = useState<Cidadao | null>(null);
  const [historico, setHistorico] = useState<EntradaHistorico[]>([]);

  useEffect(() => {
    void api<Cidadao>(`/citizens/${params.id}`).then(setCidadao);
    void api<{ entradas: EntradaHistorico[] }>(`/citizens/${params.id}/historico`)
      .then((data) => setHistorico(data.entradas))
      .catch(() => setHistorico([]));
  }, [params.id]);

  return (
    <AppShell>
      <PageHeader
        title={cidadao?.nome ?? "Prontuário"}
        description={cidadao ? [cidadao.cpf, cidadao.email, cidadao.telefone].filter(Boolean).join(" | ") : "Carregando..."}
      />

      <div className="grid two">
        <Card>
          <h2>Cadastro</h2>
          {cidadao && (
            <div className="grid">
              <p><strong>Endereco:</strong> {[cidadao.endereco, cidadao.bairro, cidadao.cidade, cidadao.uf].filter(Boolean).join(", ") || "-"}</p>
              <p><strong>NIS:</strong> {cidadao.nis ?? "-"}</p>
              <p><strong>Observacoes:</strong> {cidadao.observacoes ?? "-"}</p>
            </div>
          )}
        </Card>
        <Card>
          <h2>Historico municipal</h2>
          {historico.length === 0 ? (
            <EmptyState title="Sem historico" text="Os atendimentos desta pessoa aparecem aqui." />
          ) : (
            historico.map((entrada, index) => (
              <div className="line-row" key={`${entrada.quando}-${index}`}>
                <div className="row">
                  <strong>{entrada.o_que}</strong>
                  {entrada.no_mes_corrente && <Badge tone="warn">Mes corrente</Badge>}
                </div>
                <small>{entrada.unidade} - {new Date(entrada.quando).toLocaleDateString("pt-BR")}</small>
                {entrada.detalhe && <p>{entrada.detalhe}</p>}
              </div>
            ))
          )}
        </Card>
      </div>
    </AppShell>
  );
}
