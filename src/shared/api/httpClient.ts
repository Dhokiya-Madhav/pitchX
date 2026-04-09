/**
 * Base URL for the PlaySpot API. Set VITE_API_URL in .env when wiring to BE.
 */
export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  return (url ?? "").replace(/\/$/, "");
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return fetch(`${base}${normalizedPath}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}
