"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { Papel } from "@/types/sgcas";

/**
 * Quem pode abrir o prontuário.
 *
 * Espelha `EquipeDeAtendimento` na API (`apps/contas/permissoes.py`), que é
 * quem `GET /api/citizens/:id` aceita. **Recepção e visualizador ficam de
 * fora** — eles alcançam o histórico municipal, não o prontuário.
 *
 * Por isso o nome não vira link para todo mundo: para quem não pode abrir, o
 * link levaria a uma tela de erro. Um link que falha é pior do que texto, porque
 * promete uma coisa e entrega outra.
 */
const PODE_ABRIR_PRONTUARIO: Papel[] = [
  "ADMIN",
  "COORDENADOR",
  "ASSISTENTE_SOCIAL",
  "TECNICO",
  "GESTOR_ACOES_ITINERANTES",
];

/** Quem enxerga a tela de operadores — `Supervisao` na API. */
const PODE_VER_OPERADORES: Papel[] = ["ADMIN", "COORDENADOR"];

const ESTILO_DE_LINK =
  "rounded-sm underline decoration-transparent underline-offset-2 transition-colors " +
  "hover:text-primary hover:decoration-current focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

type PropsDoCidadao = {
  id?: string | null;
  nome?: string | null;
  className?: string;
  /** Texto quando não há nome — evita link vazio. */
  vazio?: string;
};

/**
 * Nome do cidadão, levando ao prontuário dele.
 *
 * Cai para texto simples quando falta o id ou quando o papel não alcança a
 * tela de destino.
 */
export function LinkDoCidadao({ id, nome, className, vazio = "—" }: PropsDoCidadao) {
  const { user } = useAuth();

  if (!nome) return <span className={className}>{vazio}</span>;
  if (!id || !user || !PODE_ABRIR_PRONTUARIO.includes(user.papel)) {
    return <span className={className}>{nome}</span>;
  }

  return (
    <Link
      href={`/cidadaos/${id}`}
      className={cn(ESTILO_DE_LINK, className)}
      title={`Abrir o prontuário de ${nome}`}
    >
      {nome}
    </Link>
  );
}

/**
 * Nome do servidor, levando à tela de operadores já filtrada nele.
 *
 * Não existe página por operador; o que existe é a busca da tela de usuários.
 * Levar a ela com o nome preenchido resolve a mesma pergunta — "quem é essa
 * pessoa?" — sem inventar uma rota que não existe.
 */
export function LinkDoOperador({
  nome,
  className,
  vazio = "—",
}: {
  nome?: string | null;
  className?: string;
  vazio?: string;
}) {
  const { user } = useAuth();

  if (!nome) return <span className={className}>{vazio}</span>;
  if (!user || !PODE_VER_OPERADORES.includes(user.papel)) {
    return <span className={className}>{nome}</span>;
  }

  return (
    <Link
      href={`/admin?busca=${encodeURIComponent(nome)}`}
      className={cn(ESTILO_DE_LINK, className)}
      title={`Ver ${nome} na tela de usuários`}
    >
      {nome}
    </Link>
  );
}

/**
 * Protocolo do caso, levando à lista já filtrada nele.
 *
 * O caso não tem página própria — ele abre num diálogo dentro de
 * `/casos`. O protocolo é único, então a busca da lista chega exatamente nele.
 */
export function LinkDoCaso({
  protocolo,
  className,
}: {
  protocolo?: string | null;
  className?: string;
}) {
  if (!protocolo) return null;
  return (
    <Link
      href={`/casos?busca=${encodeURIComponent(protocolo)}`}
      className={cn(ESTILO_DE_LINK, className)}
      title={`Ver o acompanhamento ${protocolo}`}
    >
      {protocolo}
    </Link>
  );
}
