"use client";

import { Plus } from "lucide-react";
import { FormEvent, useId, useMemo, useState } from "react";
import { AreaDeTexto, Button, Dropdown, Field, Input, SecondaryButton } from "@/components/ui";
import { ResultadoDoFormulario, type Resultado } from "@/components/shared/resultado-do-formulario";
import { api, mensagemDeErro } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { podeAcessarUnidade } from "@/lib/permissoes";
import { rotuloDaSituacaoDoCaso } from "@/lib/rotulos";
import type { Caso, Cidadao, Unidade } from "@/types/sgcas";

/** `BeneficioEventual.Tipo` (apps/atendimentos/models.py) — categorias do SUAS. */
const TIPOS_DE_BENEFICIO = [
  { value: "SITUACAO_VULNERABILIDADE_TEMPORARIA", label: "Vulnerabilidade temporária" },
  { value: "SITUACAO_NASCIMENTO", label: "Situação de nascimento" },
  { value: "SITUACAO_MORTE", label: "Situação de morte" },
  { value: "SITUACAO_CALAMIDADE", label: "Situação de calamidade" },
  { value: "OUTROS", label: "Outros" },
];

/** Caso encerrado não recebe encaminhamento: o destino seria um caso fechado. */
const CASO_ENCERRADO = ["CONCLUIDO", "CANCELADO"];

type Falta = { id: string; rotulo: string };

/**
 * O que falta preencher, cobrado ANTES de a requisição sair.
 *
 * Lista tudo de uma vez — um aviso por clique faria a pessoa descobrir a
 * próxima falta a cada tentativa. Cada item leva ao campo: foca e rola até
 * ele, que no celular pode estar fora da tela.
 */
function OQueFalta({ faltas }: { faltas: Falta[] }) {
  if (faltas.length === 0) return null;

  function irPara(id: string) {
    const campo = document.getElementById(id);
    campo?.scrollIntoView({ block: "center", behavior: "smooth" });
    campo?.focus({ preventScroll: true });
  }

  return (
    <div className="notice" role="alert">
      <p className="font-semibold">Falta preencher:</p>
      <ul className="mt-2 grid gap-1">
        {faltas.map((falta) => (
          <li key={falta.id}>
            <button type="button" className="underline underline-offset-2" onClick={() => irPara(falta.id)}>
              {falta.rotulo}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Botão "Registrar" que abre o formulário dentro da própria seção.
 *
 * Dentro da seção, e não num diálogo: o atendente registra olhando a lista do
 * que já foi concedido ou encaminhado, que é justamente o que ele confere para
 * não repetir.
 */
export function BotaoRegistrar({ aberto, onAlternar }: { aberto: boolean; onAlternar: () => void }) {
  return (
    <SecondaryButton type="button" className="h-9 gap-1.5 px-3 text-xs" onClick={onAlternar} aria-expanded={aberto}>
      <Plus size={14} aria-hidden="true" />
      {aberto ? "Fechar" : "Registrar"}
    </SecondaryButton>
  );
}

/*
 * Os campos vão em uma coluna só, em qualquer largura. O formulário mora na
 * coluna lateral do prontuário, que no desktop é a mais estreita da tela: a
 * grade de duas colunas por viewport (`md:`) apertava os campos ali — rótulo
 * quebrando em duas linhas e o nome da pessoa cortado no meio.
 */
function PainelDoFormulario({
  onSubmit, salvando, rotuloDoBotao, onCancelar, faltas, children,
}: {
  onSubmit: (evento: FormEvent<HTMLFormElement>) => void;
  salvando: boolean;
  rotuloDoBotao: string;
  onCancelar: () => void;
  faltas: Falta[];
  children: React.ReactNode;
}) {
  return (
    // `noValidate`: a conferência é a nossa, que lista tudo e leva ao campo —
    // o balão do navegador mostraria uma falta por vez, fora do desenho.
    <form noValidate onSubmit={onSubmit} className="col-span-full grid gap-4 rounded-lg border border-border bg-secondary/60 p-4">
      {children}
      <OQueFalta faltas={faltas} />
      <div className="flex flex-wrap justify-end gap-2">
        <SecondaryButton type="button" onClick={onCancelar} disabled={salvando}>Cancelar</SecondaryButton>
        <Button type="submit" disabled={salvando}>{salvando ? "Salvando…" : rotuloDoBotao}</Button>
      </div>
    </form>
  );
}

// --------------------------------------------------------------------------- //
// Benefício eventual
// --------------------------------------------------------------------------- //

export function RegistrarBeneficio({
  cidadao, aberto, onFechar, onSalvo,
}: {
  cidadao: Cidadao;
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => Promise<void>;
}) {
  const prefixo = useId();
  const vazio = { nome_da_pessoa: cidadao.nome, tipo: TIPOS_DE_BENEFICIO[0].value, tipo_outro: "", descricao: "" };
  const [form, setForm] = useState(vazio);
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<Resultado>(null);

  const ids = { tipo: `${prefixo}-tipo`, tipoOutro: `${prefixo}-tipo-outro` };

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const faltando: Falta[] = [];
    if (!form.tipo) faltando.push({ id: ids.tipo, rotulo: "Tipo do benefício" });
    if (form.tipo === "OUTROS" && !form.tipo_outro.trim()) {
      faltando.push({ id: ids.tipoOutro, rotulo: "Qual é o benefício (tipo Outros)" });
    }
    setFaltas(faltando);
    if (faltando.length) return;

    setSalvando(true);
    try {
      await api(`/citizens/${cidadao.id}/beneficios`, { method: "POST", body: JSON.stringify(form) });
      setForm(vazio);
      onFechar();
      await onSalvo();
      setResultado({
        ok: true,
        titulo: "Benefício registrado",
        mensagem: `O benefício para ${form.nome_da_pessoa || cidadao.nome} já aparece no prontuário.`,
      });
    } catch (erro) {
      setResultado({
        ok: false,
        titulo: "Não foi possível registrar",
        mensagem: mensagemDeErro(erro, "Não foi possível registrar o benefício", "Confira os dados e tente de novo."),
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      {aberto && (
        <PainelDoFormulario
          onSubmit={salvar}
          salvando={salvando}
          rotuloDoBotao="Salvar benefício"
          onCancelar={() => { setFaltas([]); onFechar(); }}
          faltas={faltas}
        >
          <div className="grid gap-4">
            <Field label="Pessoa beneficiada">
              <Input
                value={form.nome_da_pessoa}
                onChange={(e) => setForm((f) => ({ ...f, nome_da_pessoa: e.target.value }))}
              />
            </Field>
            <Field label="Tipo">
              <Dropdown
                id={ids.tipo}
                rotulo="Tipo do benefício"
                opcoes={TIPOS_DE_BENEFICIO}
                value={form.tipo}
                onChange={(tipo) => setForm((f) => ({ ...f, tipo }))}
                required
              />
            </Field>
          </div>
          {form.tipo === "OUTROS" && (
            <Field label="Qual benefício?">
              <Input
                id={ids.tipoOutro}
                value={form.tipo_outro}
                placeholder="Ex.: passagem, documentação"
                onChange={(e) => setForm((f) => ({ ...f, tipo_outro: e.target.value }))}
                aria-required="true"
              />
            </Field>
          )}
          <Field label="Descrição / justificativa">
            <AreaDeTexto
              value={form.descricao}
              placeholder="O que foi concedido, o motivo e a orientação dada."
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            />
          </Field>
        </PainelDoFormulario>
      )}
      <ResultadoDoFormulario resultado={resultado} onFechar={() => setResultado(null)} />
    </>
  );
}

// --------------------------------------------------------------------------- //
// Encaminhamento
// --------------------------------------------------------------------------- //

const NOVO_CASO = "";

export function RegistrarEncaminhamento({
  cidadao, casos, unidades, aberto, onFechar, onSalvo,
}: {
  cidadao: Cidadao;
  casos: Caso[];
  unidades: Unidade[];
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => Promise<void>;
}) {
  const { user } = useAuth();
  const prefixo = useId();
  const vazio = { caso_id: NOVO_CASO, unidade_destino_id: "", destino_externo: "", motivo: "", observacoes: "" };
  const [form, setForm] = useState(vazio);
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<Resultado>(null);

  const ids = { destino: `${prefixo}-destino`, motivo: `${prefixo}-motivo` };

  // Só os casos em que este operador pode mexer. O caso de outra unidade
  // voltaria como 403 — e a pessoa só descobriria depois de preencher tudo.
  const opcoesDeCaso = useMemo(() => [
    { value: NOVO_CASO, label: "Abrir um caso para este encaminhamento" },
    ...casos
      .filter((c) => !CASO_ENCERRADO.includes(c.situacao) && podeAcessarUnidade(user, c.unidade))
      .map((c) => ({ value: c.id, label: c.protocolo, hint: `${rotuloDaSituacaoDoCaso(c.situacao)} · ${c.unidade_nome}` })),
  ], [casos, user]);

  const opcoesDeUnidade = useMemo(() => [
    { value: "", label: "Serviço de fora da rede" },
    ...unidades.map((u) => ({ value: u.id, label: u.nome_qualificado || u.nome })),
  ], [unidades]);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const faltando: Falta[] = [];
    // Um destino, e só um — é a regra da API: os dois deixariam ambíguo para
    // onde a pessoa deve ir.
    if (!form.unidade_destino_id && !form.destino_externo.trim()) {
      faltando.push({ id: ids.destino, rotulo: "Destino (unidade da rede ou serviço de fora)" });
    }
    if (!form.motivo.trim()) faltando.push({ id: ids.motivo, rotulo: "Motivo" });
    setFaltas(faltando);
    if (faltando.length) return;

    setSalvando(true);
    try {
      await api(`/citizens/${cidadao.id}/encaminhamentos`, { method: "POST", body: JSON.stringify(form) });
      const destino = unidades.find((u) => u.id === form.unidade_destino_id);
      setForm(vazio);
      onFechar();
      await onSalvo();
      setResultado({
        ok: true,
        titulo: "Encaminhamento registrado",
        mensagem: destino
          ? `O caso passou para ${destino.nome_qualificado || destino.nome}, que já o vê na lista dela.`
          : `Encaminhado para ${form.destino_externo.trim()}.`,
      });
    } catch (erro) {
      setResultado({
        ok: false,
        titulo: "Não foi possível encaminhar",
        mensagem: mensagemDeErro(erro, "Não foi possível registrar o encaminhamento", "Confira os dados e tente de novo."),
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      {aberto && (
        <PainelDoFormulario
          onSubmit={salvar}
          salvando={salvando}
          rotuloDoBotao="Salvar encaminhamento"
          onCancelar={() => { setFaltas([]); onFechar(); }}
          faltas={faltas}
        >
          <div className="grid gap-4">
            <Field label="Caso">
              <Dropdown
                rotulo="Caso vinculado"
                opcoes={opcoesDeCaso}
                value={form.caso_id}
                onChange={(caso_id) => setForm((f) => ({ ...f, caso_id }))}
              />
            </Field>
            <Field label="Destino na rede">
              <Dropdown
                id={ids.destino}
                rotulo="Unidade de destino"
                opcoes={opcoesDeUnidade}
                value={form.unidade_destino_id}
                buscavel
                onChange={(unidade_destino_id) => setForm((f) => ({
                  ...f,
                  unidade_destino_id,
                  // Escolher unidade apaga o destino externo: os dois juntos a
                  // API recusa.
                  destino_externo: unidade_destino_id ? "" : f.destino_externo,
                }))}
              />
            </Field>
          </div>
          {!form.unidade_destino_id && (
            <Field label="Serviço de fora da rede">
              <Input
                value={form.destino_externo}
                placeholder="Ex.: Conselho Tutelar, UBS, Defensoria Pública"
                onChange={(e) => setForm((f) => ({ ...f, destino_externo: e.target.value }))}
                aria-required="true"
              />
            </Field>
          )}
          <div className="grid gap-4">
            <Field label="Motivo">
              <AreaDeTexto
                id={ids.motivo}
                value={form.motivo}
                placeholder="Por que a pessoa está sendo encaminhada?"
                onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
                aria-required="true"
              />
            </Field>
            <Field label="Observações">
              <AreaDeTexto
                value={form.observacoes}
                placeholder="Documentos, combinados e orientações."
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              />
            </Field>
          </div>
        </PainelDoFormulario>
      )}
      <ResultadoDoFormulario resultado={resultado} onFechar={() => setResultado(null)} />
    </>
  );
}
