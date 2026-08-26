"use client";

type ApiOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

const logoutMarker = "sgcas-logged-out";

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
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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

export function loginWithTefeCidadao() {
  clearLogoutMarker();
  // OAuth precisa de navegacao completa para sair da SPA e seguir o redirect.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = "/api/auth/keycloak/login";
}
