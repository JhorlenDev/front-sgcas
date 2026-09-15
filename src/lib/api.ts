"use client";

import type { Paginado } from "@/types/sgcas";

type ApiOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

const logoutMarker = "sgcas-logged-out";

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Frase legível de uma resposta de erro da API.
 *
 * A API responde `{ "detalhe": "..." }` (ou `detail`, nas respostas do próprio
 * DRF), e validação vem como `{ "campo": ["mensagem"] }`. Antes só texto puro
 * virava mensagem, e as telas mostravam "Erro 404" onde a API tinha dito
 * "Não há ninguém aguardando". Portado da `atualização-jhorlen` (a1af3f3), com
 * o formato de validação acrescentado.
 */
function mensagemDoErro(status: number, data: unknown): string {
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const corpo = data as Record<string, unknown>;
    for (const chave of ["detalhe", "detail"]) {
      if (typeof corpo[chave] === "string") return corpo[chave] as string;
    }
    for (const valor of Object.values(corpo)) {
      if (typeof valor === "string") return valor;
      if (Array.isArray(valor) && typeof valor[0] === "string") return valor[0];
    }
  }
  return `Erro ${status}`;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(mensagemDoErro(status, data));
    this.status = status;
    this.data = data;
  }
}

/**
 * Mensagem de falha para a tela: o contexto de quem chamou + o motivo da API.
 *
 * "Não foi possível cadastrar a unidade" sozinho não diz o que corrigir; o
 * motivo sozinho ("Já existe unidade com esta sigla") perde o que se tentava
 * fazer. Sem motivo aproveitável (rede caída, erro sem corpo), vale a
 * `reserva` — que pode trazer a dica genérica de antes ("Confira sigla e campos
 * obrigatórios"), inútil quando a API já disse qual campo falhou.
 */
export function mensagemDeErro(erro: unknown, contexto: string, reserva = `${contexto}.`): string {
  if (erro instanceof ApiError && !/^Erro \d+$/.test(erro.message)) {
    return `${contexto}: ${erro.message}`;
  }
  return reserva;
}

export function clearLogoutMarker() {
  window.localStorage.removeItem(logoutMarker);
}

export function markLoggedOut() {
  window.localStorage.setItem(logoutMarker, "true");
}

export function isMarkedLoggedOut() {
  return window.localStorage.getItem(logoutMarker) === "true";
}

function redirectToLogin() {
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const isMutating = method !== "GET" && method !== "HEAD";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  };

  if (isMutating) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers["X-CSRFToken"] = csrf;
    }
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const text = await response.text();
  // Proxy, túnel ou servidor caído respondem HTML (502, página de erro). O
  // `JSON.parse` estourava `SyntaxError: Unexpected token '<'`, que escapava do
  // `catch` de quem chamou como se fosse defeito da tela.
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(response.status, "O servidor respondeu de um jeito inesperado. Tente de novo em instantes.");
  }

  if (!response.ok) {
    if (response.status === 401 && !options.skipAuthRedirect) {
      redirectToLogin();
    }
    throw new ApiError(response.status, data);
  }

  return data as T;
}

/**
 * Monta a query string ignorando o que está vazio.
 *
 * Enviar `?situacao=` faria a API filtrar por situação vazia e devolver lista
 * vazia — o filtro "todos" viraria o filtro "nenhum". Chave sem valor não vai.
 */
export function comQuery(base: string, params: Record<string, string | number | undefined | null>) {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null) continue;
    const texto = String(valor).trim();
    if (texto) busca.set(chave, texto);
  }
  const query = busca.toString();
  return query ? `${base}?${query}` : base;
}

/** Envelope vazio — usado como resultado de falha, para a tela não quebrar. */
export function paginadoVazio<T>(porPagina = 25): Paginado<T> {
  return { itens: [], total: 0, pagina: 1, por_pagina: porPagina, paginas: 1 };
}

export function loginWithTefeCidadao() {
  clearLogoutMarker();
  // Precisa ser navegação do navegador, e não router.push(): /api/ não é
  // página do Next, e sim proxy para o Django (ver rewrites em
  // next.config.ts), que responde 302 para o Keycloak. Navegação
  // client-side não segue redirect do servidor para um domínio externo, e o
  // login não sairia do lugar.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- destino é o backend, não uma rota do Next
  window.location.href = "/api/auth/keycloak/login";
}
