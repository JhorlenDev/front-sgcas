"use client";

import { ArrowRight, FileText, Search, UserPlus } from "lucide-react";
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
import { TermoLGPD } from "@/components/shared/termo-lgpd";
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
  const [mostrarTermo, setMostrarTermo] = useState(false);
  const [termoLido, setTermoLido] = useState(false);
  const [criarAcesso, setCriarAcesso] = useState(true);

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
          consentimento: termoLido,
          criar_acesso_tefe_cidadao: criarAcesso,
        }),
      });

      setModalAberto(false);
      setTermoLido(false);
      event.currentTarget.reset();
      router.push(`/cidadaos/${cidadao.id}`);
    } catch {
      setErroCadastro("Não foi possível salvar. Confira os dados e o consentimento.");
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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Digite nome, CPF, NIS ou e-mail"
          />
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="!mb-0">{busca.trim() && buscou ? "Resultado da busca" : "Cidadãos recentes"}</h2>
          {carregando && <span className="text-sm text-muted-foreground">Carregando...</span>}
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
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-primary-hover">
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

            <div className="grid gap-3 rounded-lg bg-secondary p-4">
              <h4 className="text-sm font-semibold text-foreground">Termos de Uso e Privacidade (LGPD)</h4>

              <button
                type="button"
                onClick={() => setMostrarTermo(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <FileText size={14} />
                Ler termo completo
              </button>

              <label className="row text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={criarAcesso}
                  onChange={(e) => setCriarAcesso(e.target.checked)}
                />
                Criar acesso no Tefé Cidadão
              </label>

              <label className="row text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={termoLido}
                  onChange={(e) => setTermoLido(e.target.checked)}
                />
                Confirmo que li o termo acima para o cidadão e este consente
              </label>

              {criarAcesso && !termoLido && (
                <p className="text-xs text-[var(--pmt-color-warning-soft-fg)]">
                  Para criar acesso, confirme que o termo foi lido para o cidadão
                </p>
              )}
            </div>

            {erroCadastro && <div className="notice">{erroCadastro}</div>}

            <DialogFooter>
              <SecondaryButton type="button" onClick={() => setModalAberto(false)} disabled={salvando}>
                Cancelar
              </SecondaryButton>
              <Button disabled={salvando || (criarAcesso && !termoLido)}>
                {salvando ? "Salvando..." : "Salvar cadastro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarTermo} onOpenChange={setMostrarTermo}>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Termo de Consentimento LGPD</DialogTitle>
            <DialogDescription>
              Leia atentamente antes de prosseguir com o cadastro.
            </DialogDescription>
          </DialogHeader>

          <TermoLGPD />

          <DialogFooter>
            <SecondaryButton onClick={() => setMostrarTermo(false)}>
              Fechar
            </SecondaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
