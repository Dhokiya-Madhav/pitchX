const TOKEN_KEY = "playspot.auth.token";
const USER_KEY = "playspot.auth.user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_owner: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed || parsed.is_owner === undefined) return null;
    return {
      id: String(parsed.id),
      name: String(parsed.name ?? ""),
      email: String(parsed.email ?? ""),
      phone: String(parsed.phone ?? ""),
      is_owner: Boolean(parsed.is_owner),
    };
  } catch {
    return null;
  }
}

export function setAuthSession({ token, user }: AuthSession): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
