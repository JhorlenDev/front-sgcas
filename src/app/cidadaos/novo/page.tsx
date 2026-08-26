"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import type { Cidadao } from "@/types/sgcas";

export default function NovoCidadaoPage() {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
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
      router.replace(`/cidadaos/${cidadao.id}`);
    } catch {
      setErro("Nao foi possivel salvar. Confira e-mail e consentimento.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Novo cidadão" description="Cadastro completo pode ser refinado depois no atendimento." />

      <Card>
        <form className="grid two" onSubmit={salvar}>
          <Field label="Nome">
            <Input name="nome" required />
          </Field>
          <Field label="E-mail">
            <Input name="email" type="email" required />
          </Field>
          <Field label="CPF">
            <Input name="cpf" />
          </Field>
          <Field label="NIS">
            <Input name="nis" />
          </Field>
          <Field label="Telefone">
            <Input name="telefone" />
          </Field>
          <Field label="Nascimento">
            <Input name="nascimento" type="date" />
          </Field>
          <Field label="Bairro">
            <Input name="bairro" />
          </Field>
          <Field label="Cidade">
            <Input name="cidade" defaultValue="Tefe" />
          </Field>
          <Field label="UF">
            <Input name="uf" defaultValue="AM" />
          </Field>
          <Field label="Endereco">
            <Input name="endereco" />
          </Field>
          <label className="row">
            <input name="criar_acesso_tefe_cidadao" type="checkbox" defaultChecked />
            Criar acesso no Tefe Cidadao
          </label>
          <label className="row">
            <input name="consentimento" type="checkbox" />
            Termo lido e consentido
          </label>
          {erro && <div className="notice">{erro}</div>}
          <div>
            <Button disabled={salvando}>{salvando ? "Salvando..." : "Salvar cadastro"}</Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
