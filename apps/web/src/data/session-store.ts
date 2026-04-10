const ACCESS = "domidocs_access_token";
const REFRESH = "domidocs_refresh_token";

export function saveSession(access: string, refresh: string): void {
  sessionStorage.setItem(ACCESS, access);
  sessionStorage.setItem(REFRESH, refresh);
}

export function clearSession(): void {
  sessionStorage.removeItem(ACCESS);
  sessionStorage.removeItem(REFRESH);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH);
}
