import type { AuthSessionResponse } from "../types/auth";

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return normalizeUrl(configured);
  }

  // Safe fallback for local/dev setups where the API is served from the same origin.
  return normalizeUrl(window.location.origin);
}

export function getAllowedGitHubLogin(): string {
  const login = import.meta.env.VITE_ALLOWED_GITHUB_LOGIN;
  if (!login) {
    throw new Error("Missing VITE_ALLOWED_GITHUB_LOGIN");
  }

  return login.trim().toLowerCase();
}

export function createGitHubLoginUrl(): string {
  const callbackUrl = encodeURIComponent(window.location.href);
  return `${getApiBaseUrl()}/auth/github/login?redirect=${callbackUrl}`;
}

export async function fetchAuthSession(): Promise<AuthSessionResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/session`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json"
    }
  });

  if (response.status === 401 || response.status === 403) {
    return { authenticated: false };
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Auth session check failed: ${response.status} ${text}`);
  }

  return (await response.json()) as AuthSessionResponse;
}
