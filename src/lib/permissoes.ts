import type { Operador, Papel } from "@/types/sgcas";

/**
 * Espelho, no front, das permissões por papel da API.
 *
 * A autorização de verdade mora em `apps/contas/permissoes.py` — a tela só usa
 * isto para não oferecer o que a API vai recusar: um link que leva a erro, um
 * botão que devolve 403. Mudou a classe na API, muda aqui.
 */

/** `EquipeDeAtendimento`: abre prontuário, chama senha, registra atendimento. */
const EQUIPE_DE_ATENDIMENTO: readonly Papel[] = [
  "ADMIN",
  "COORDENADOR",
  "ASSISTENTE_SOCIAL",
  "TECNICO",
  "GESTOR_ACOES_ITINERANTES",
];

/** `Supervisao`: vê e edita operadores. */
const SUPERVISAO: readonly Papel[] = ["ADMIN", "COORDENADOR"];

export function ehEquipeDeAtendimento(papel?: string | null): boolean {
  return EQUIPE_DE_ATENDIMENTO.includes(papel as Papel);
}

export function ehSupervisao(papel?: string | null): boolean {
  return SUPERVISAO.includes(papel as Papel);
}

/** `VE_TODAS_AS_UNIDADES` (apps/contas/papeis.py). */
const VE_TODAS_AS_UNIDADES: readonly Papel[] = ["ADMIN"];

/**
 * `pode_acessar_unidade` (apps/contas/escopo.py): quem pode mexer num caso
 * daquela unidade.
 *
 * O cadastro do cidadão é municipal, mas o caso em andamento é da unidade que
 * o atende. A tela usa isto para não oferecer o caso alheio — escolhido, ele
 * voltaria como 403 "Caso de outra unidade".
 */
export function podeAcessarUnidade(
  operador: Pick<Operador, "papel" | "unidade_id" | "unidade"> | null | undefined,
  unidadeId?: string | null,
): boolean {
  if (!operador) return false;
  if (VE_TODAS_AS_UNIDADES.includes(operador.papel)) return true;
  const propria = operador.unidade_id ?? operador.unidade?.id ?? null;
  return Boolean(propria) && propria === unidadeId;
}
