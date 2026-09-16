"use client";

import { Building2, Loader2, Search } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, CampoData, Field, Input, SecondaryButton } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCPFInput, formatDateOnly, isValidCPF, onlyDigits } from "@/lib/utils";
import type { ConsultaCentral, DadosDaCentral } from "@/types/sgcas";

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
 * Respostas já obtidas nesta aba, por CPF.
 *
 * A central tem teto de 120 requisições por minuto por IP, e o prédio inteiro
 * sai pelo mesmo. Voltar ao campo do CPF — para conferir um dígito, para
 * corrigir o nome — não pode gerar consulta nova a cada vez.
 */
const consultado = new Map<string, ConsultaCentral>();

/**
 * Campos do cadastro de cidadão, com consulta ao cadastro central.
 *
 * Vive fora das telas porque o mesmo formulário aparece em dois lugares — a
 * página `/cidadaos/novo` e o diálogo da lista. Duplicado, a consulta à central
 * precisaria ser escrita duas vezes e as duas iam divergir na primeira correção.
 *
 * Os campos são controlados (é o que permite preenchê-los de fora), mas todos
 * têm `name`: quem chama continua lendo o formulário com `FormData`, sem
 * precisar saber que há estado aqui dentro.
 */
export function CamposDoCidadao() {
  const [valores, setValores] = useState<Valores>(VAZIO);
  const [daCentral, setDaCentral] = useState<Set<string>>(new Set());
  const [consulta, setConsulta] = useState<ConsultaCentral | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [ofereceu, setOfereceu] = useState<DadosDaCentral | null>(null);
  const ultimoConsultado = useRef("");

  const aplicar = useCallback((resposta: ConsultaCentral) => {
    setConsulta(resposta);

    // Quem já tem cadastro aqui não precisa de formulário preenchido: precisa
    // que o atendente abra a ficha existente. Oferecer o preenchimento nesse
    // caso convida exatamente a duplicata que o aviso está tentando evitar —
    // e o diálogo ainda cobriria o aviso.
    if (resposta.cidadao && !resposta.ja_cadastrado_local) {
      setOfereceu(resposta.cidadao);
    }
  }, []);

  const muda = useCallback((campo: keyof Valores, valor: string) => {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
    // Editado à mão deixa de ser "veio da central" — o destaque tem que sair
    // junto, senão passa a afirmar uma origem que não é mais verdade.
    setDaCentral((atuais) => {
      if (!atuais.has(campo)) return atuais;
      const proximos = new Set(atuais);
      proximos.delete(campo);
      return proximos;
    });
  }, []);

  const procurar = useCallback(async (mascarado: string) => {
    const digitos = onlyDigits(mascarado);

    // Só com CPF completo e válido. Consultar a cada tecla queimaria o teto da
    // central, e o CPF malformado volta como 404 — indistinguível de "essa
    // pessoa não existe", que é a resposta que faria o atendente desistir.
    if (!isValidCPF(digitos) || digitos === ultimoConsultado.current) return;
    ultimoConsultado.current = digitos;

    const guardado = consultado.get(digitos);
    if (guardado) {
      aplicar(guardado);
      return;
    }

    setConsultando(true);
    try {
      const resposta = await api<ConsultaCentral>(
        `/citizens/consulta-central?cpf=${digitos}`,
      );
      consultado.set(digitos, resposta);
      aplicar(resposta);
    } catch {
      // Consulta é conveniência: falhar não pode atrapalhar quem está com a
      // pessoa na frente. O formulário segue preenchível à mão, em silêncio.
      setConsulta(null);
    } finally {
      setConsultando(false);
    }
  }, [aplicar]);

  function preencher(dados: DadosDaCentral) {
    const vindos = new Set<string>();
    setValores((atuais) => {
      const proximos = { ...atuais };
      (Object.keys(VAZIO) as (keyof Valores)[]).forEach((campo) => {
        const valor = dados[campo as keyof DadosDaCentral];
        if (typeof valor === "string" && valor) {
          proximos[campo] = campo === "cpf" ? formatCPFInput(valor) : valor;
          if (campo !== "cpf") vindos.add(campo);
        }
      });
      return proximos;
    });
    setDaCentral(vindos);
    setOfereceu(null);
  }

  const marca = (campo: keyof Valores) =>
    daCentral.has(campo) ? "ring-1 ring-[var(--pmt-color-primary)]" : "";

  const jaExiste = consulta?.ja_cadastrado_local;

  return (
    <>
      <div className="grid gap-4">
        {jaExiste && (
          <div className="notice">
            Este CPF já tem cadastro no SGCAS:{" "}
            <Link href={`/cidadaos/${jaExiste.id}`} className="font-semibold underline">
              {jaExiste.nome}
            </Link>
            . Confira antes de criar outro.
          </div>
        )}

        <Field label="Nome">
          <Input
            name="nome"
            placeholder="Digite nome e sobrenome"
            required
            className={marca("nome")}
            value={valores.nome}
            onChange={(e) => muda("nome", e.target.value)}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="CPF">
            <div className="relative">
              <Input
                placeholder="000.000.000-00"
                inputMode="numeric"
                autoComplete="off"
                className="pr-10"
                value={valores.cpf}
                onChange={(e) => muda("cpf", formatCPFInput(e.target.value))}
                onBlur={(e) => void procurar(e.target.value)}
              />
              {/* O que vai para a API são só os dígitos: a máscara é de leitura. */}
              <input type="hidden" name="cpf" value={onlyDigits(valores.cpf)} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {consultando ? (
                  <Loader2 size={16} className="animate-spin" aria-label="Consultando cadastro central" />
                ) : (
                  <Search size={16} aria-hidden="true" />
                )}
              </span>
            </div>
          </Field>

          <Field label="E-mail">
            <Input
              name="email"
              type="email"
              placeholder="cidadao@email.com"
              required
              className={marca("email")}
              value={valores.email}
              onChange={(e) => muda("email", e.target.value)}
            />
          </Field>

          <Field label="NIS">
            <Input
              name="nis"
              className={marca("nis")}
              value={valores.nis}
              onChange={(e) => muda("nis", e.target.value)}
            />
          </Field>

          <Field label="Telefone">
            <Input
              name="telefone"
              placeholder="(92) 99999-9999"
              className={marca("telefone")}
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
              className={marca("bairro")}
              value={valores.bairro}
              onChange={(e) => muda("bairro", e.target.value)}
            />
          </Field>

          <Field label="Cidade">
            <Input
              name="cidade"
              className={marca("cidade")}
              value={valores.cidade}
              onChange={(e) => muda("cidade", e.target.value)}
            />
          </Field>

          <Field label="UF">
            <Input
              name="uf"
              maxLength={2}
              className={marca("uf")}
              value={valores.uf}
              onChange={(e) => muda("uf", e.target.value.toUpperCase())}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Endereço">
              <Input
                name="endereco"
                className={marca("endereco")}
                value={valores.endereco}
                onChange={(e) => muda("endereco", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {daCentral.size > 0 && (
          <p className="text-xs text-muted-foreground">
            Os campos destacados vieram do cadastro central da Prefeitura. Confirme com a
            pessoa antes de salvar.
          </p>
        )}
      </div>

      <Dialog open={ofereceu !== null} onOpenChange={(aberto) => !aberto && setOfereceu(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Encontramos esta pessoa no cadastro central</DialogTitle>
            <DialogDescription>
              O cadastro central da Prefeitura já tem dados deste CPF. Preencher o
              formulário com eles evita redigitar e mantém as secretarias falando da
              mesma pessoa.
            </DialogDescription>
          </DialogHeader>

          {ofereceu && (
            <div className="grid gap-2 rounded-lg bg-secondary p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Building2 size={16} aria-hidden="true" />
                {ofereceu.nome ?? "Sem nome na central"}
              </div>
              {ofereceu.nascimento && (
                <div>Nascimento: {formatDateOnly(ofereceu.nascimento)}</div>
              )}
              {ofereceu.bairro && <div>Bairro: {ofereceu.bairro}</div>}
            </div>
          )}

          <DialogFooter>
            <SecondaryButton type="button" onClick={() => setOfereceu(null)}>
              Não preencher
            </SecondaryButton>
            <Button type="button" onClick={() => ofereceu && preencher(ofereceu)}>
              Preencher formulário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
