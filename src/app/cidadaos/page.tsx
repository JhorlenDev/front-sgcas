"use client";

import { ArrowRight, Search, UserPlus } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, Card, EmptyState, Field, Input, PageHeader, SecondaryButton } from "@/components/ui";
import { api } from "@/lib/api";
import type { Cidadao, CidadaoLista } from "@/types/sgcas";

export default function CidadaosPage() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<CidadaoLista[]>([]);
  const [buscou, setBuscou] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregarCidadaos = useCallback(async (termo = "") => {
    setCarregando(true);
    const query = termo.trim() ? `?busca=${encodeURIComponent(termo.trim())}` : "";
    const data = await api<CidadaoLista[]>(`/citizens/${query}`).catch(() => []);
    setResultados(data);
    setBuscou(true);
    setCarregando(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregarCidadaos(busca);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [busca, carregarCidadaos]);

  async function salvarCidadao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErroCadastro("");
    setSalvando(true);

    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());

    try {
      const cidadao = await api<Cidadao>("/citizens/novo", {
        method: "POST",
        body: JSON.stringify({
          ...body,
          consentimento: form.get("consentimento") === "on",
          criar_acesso_tefe_cidadao: form.get("criar_acesso_tefe_cidadao") === "on",
        }),
      });

      setModalAberto(false);
      event.currentTarget.reset();
      router.push(`/cidadaos/${cidadao.id}`);
    } catch {
      setErroCadastro("Não foi possível salvar. Confira e-mail e consentimento.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Buscar cidadão"
        description="Lista de cidadãos recentes e busca municipal por CPF, NIS, e-mail ou nome."
        action={
          <Button type="button" onClick={() => setModalAberto(true)}>
            <UserPlus size={18} />
            Novo cadastro
          </Button>
        }
      />

      <Card>
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-meta-slate" />
          <Input
            className="pl-10"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Digite nome, CPF, NIS ou e-mail"
          />
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="!mb-0">{busca.trim() && buscou ? "Resultado da busca" : "Cidadãos recentes"}</h2>
          {carregando && <span className="text-sm text-meta-slate">Carregando...</span>}
        </div>

        {resultados.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Endereço</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((cidadao) => (
                <tr
                  className="clickable-row group"
                  key={cidadao.id}
                  onClick={() => router.push(`/cidadaos/${cidadao.id}`)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/cidadaos/${cidadao.id}`);
                    }
                  }}
                >
                  <td>
                    <strong>{cidadao.nome}</strong>
                  </td>
                  <td>{cidadao.cpf ?? "-"}</td>
                  <td>{[cidadao.bairro, cidadao.cidade].filter(Boolean).join(" - ") || "-"}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-primary-hover">
                      Abrir
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!carregando && buscou && resultados.length === 0 && (
          <EmptyState
            title={busca.trim() ? "Nada encontrado" : "Nenhum cidadão cadastrado"}
            text={busca.trim() ? "Confira o dado informado ou crie um novo cadastro." : "Quando houver cadastros, eles aparecem aqui automaticamente."}
          />
        )}
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar novo cidadão</DialogTitle>
            <DialogDescription>
              Informe os dados essenciais para identificar o cidadão e seguir com o atendimento.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={salvarCidadao}>
            <Field label="Nome">
              <Input name="nome" placeholder="Digite nome e sobrenome" required />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="E-mail">
                <Input name="email" type="email" placeholder="cidadao@email.com" required />
              </Field>
              <Field label="CPF">
                <Input name="cpf" placeholder="000.000.000-00" />
              </Field>
              <Field label="NIS">
                <Input name="nis" />
              </Field>
              <Field label="Telefone">
                <Input name="telefone" placeholder="(92) 99999-9999" />
              </Field>
              <Field label="Data de nascimento">
                <Input name="nascimento" type="date" />
              </Field>
              <Field label="Bairro">
                <Input name="bairro" />
              </Field>
              <Field label="Cidade">
                <Input name="cidade" defaultValue="Tefé" />
              </Field>
              <Field label="UF">
                <Input name="uf" defaultValue="AM" />
              </Field>
              <Field label="Endereço">
                <Input name="endereco" />
              </Field>
            </div>

            <div className="grid gap-3 rounded-lg bg-meta-soft-gray p-4">
              <label className="row text-sm text-meta-charcoal">
                <input name="criar_acesso_tefe_cidadao" type="checkbox" defaultChecked />
                Criar acesso no Tefé Cidadão
              </label>
              <label className="row text-sm text-meta-charcoal">
                <input name="consentimento" type="checkbox" />
                Termo lido e consentido
              </label>
            </div>

            {erroCadastro && <div className="notice">{erroCadastro}</div>}

            <DialogFooter>
              <SecondaryButton type="button" onClick={() => setModalAberto(false)} disabled={salvando}>
                Cancelar
              </SecondaryButton>
              <Button disabled={salvando}>{salvando ? "Salvando..." : "Salvar cadastro"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
