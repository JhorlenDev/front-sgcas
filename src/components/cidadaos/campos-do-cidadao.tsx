"use client";

import { useCallback, useState } from "react";
import { CampoData, Field, Input } from "@/components/ui";
import { formatCPFInput, onlyDigits } from "@/lib/utils";

const HOJE = new Date().toISOString().slice(0, 10);

type Valores = {
  nome: string;
  email: string;
  cpf: string;
  nis: string;
  telefone: string;
  nascimento: string;
  bairro: string;
  cidade: string;
  uf: string;
  endereco: string;
};

const VAZIO: Valores = {
  nome: "", email: "", cpf: "", nis: "", telefone: "",
  nascimento: "", bairro: "", cidade: "Tefé", uf: "AM", endereco: "",
};

/**
 * Campos do cadastro de cidadão.
 *
 * Vive fora das telas porque o mesmo formulário aparecia escrito duas vezes — a
 * página `/cidadaos/novo` e o diálogo da lista — com diferenças que ninguém
 * quis: a página não tinha placeholder em campo nenhum, gravava a cidade como
 * "Tefe" sem acento, e as duas dispunham os campos em grades diferentes.
 *
 * Os campos são controlados, mas todos têm `name`: quem chama continua lendo o
 * formulário com `FormData`, sem precisar saber que há estado aqui dentro.
 * Como `form.reset()` não limpa campo controlado, quem reaproveita a tela
 * (o diálogo) remonta o componente trocando a `key`.
 */
export function CamposDoCidadao() {
  const [valores, setValores] = useState<Valores>(VAZIO);

  const muda = useCallback((campo: keyof Valores, valor: string) => {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
  }, []);

  return (
    <div className="grid gap-4">
      <Field label="Nome">
        <Input
          name="nome"
          placeholder="Digite nome e sobrenome"
          required
          value={valores.nome}
          onChange={(e) => muda("nome", e.target.value)}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="CPF">
          <Input
            placeholder="000.000.000-00"
            inputMode="numeric"
            autoComplete="off"
            value={valores.cpf}
            onChange={(e) => muda("cpf", formatCPFInput(e.target.value))}
          />
          {/* O que vai para a API são só os dígitos: a máscara é de leitura. */}
          <input type="hidden" name="cpf" value={onlyDigits(valores.cpf)} />
        </Field>

        <Field label="E-mail">
          <Input
            name="email"
            type="email"
            placeholder="cidadao@email.com"
            required
            value={valores.email}
            onChange={(e) => muda("email", e.target.value)}
          />
        </Field>

        <Field label="NIS">
          <Input
            name="nis"
            value={valores.nis}
            onChange={(e) => muda("nis", e.target.value)}
          />
        </Field>

        <Field label="Telefone">
          <Input
            name="telefone"
            placeholder="(92) 99999-9999"
            value={valores.telefone}
            onChange={(e) => muda("telefone", e.target.value)}
          />
        </Field>

        <Field label="Data de nascimento">
          <CampoData
            name="nascimento"
            rotulo="Data de nascimento"
            max={HOJE}
            value={valores.nascimento}
            onChange={(valor) => muda("nascimento", valor)}
          />
        </Field>

        <Field label="Bairro">
          <Input
            name="bairro"
            value={valores.bairro}
            onChange={(e) => muda("bairro", e.target.value)}
          />
        </Field>

        <Field label="Cidade">
          <Input
            name="cidade"
            value={valores.cidade}
            onChange={(e) => muda("cidade", e.target.value)}
          />
        </Field>

        <Field label="UF">
          <Input
            name="uf"
            maxLength={2}
            value={valores.uf}
            onChange={(e) => muda("uf", e.target.value.toUpperCase())}
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Endereço">
            <Input
              name="endereco"
              value={valores.endereco}
              onChange={(e) => muda("endereco", e.target.value)}
            />
          </Field>
        </div>
      </div>

    </div>

  );
}
