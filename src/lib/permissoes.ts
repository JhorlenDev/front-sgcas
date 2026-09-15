import type { Papel } from "@/types/sgcas";

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
