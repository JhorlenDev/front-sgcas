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

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(typeof data === "string" ? data : `Erro ${status}`);
    this.status = status;
    this.data = data;
  }
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
  const data = text ? JSON.parse(text) : null;

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
