import { AuthRoutes, WebApiRoutes } from "@domidocs/contracts";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "@domidocs/contracts";
import { getAccessToken } from "./session-store";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function register(body: RegisterRequest): Promise<RegisterResponse> {
  const res = await fetch(AuthRoutes.register, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await parseJson<{ error?: string }>(res);
    throw new Error(err.error ?? res.statusText);
  }
  return parseJson<RegisterResponse>(res);
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(AuthRoutes.login, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await parseJson<{ error?: string }>(res);
    throw new Error(err.error ?? res.statusText);
  }
  return parseJson<LoginResponse>(res);
}

export async function fetchMe(): Promise<{ userId: string; email: string }> {
  const token = getAccessToken();
  const res = await fetch(WebApiRoutes.me, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Not authenticated");
  return parseJson(res);
}
