import { AuthRoutes } from "@domidocs/contracts";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { registerUser } from "../application/register-user";
import { loginUser } from "../application/login-user";
import { refreshSession } from "../application/refresh-session";
import { buildJwksJson } from "../application/jwt-service";
import type { AuthEnv } from "../config";
import type { InMemoryRefreshTokenRepository, RefreshTokenRepository } from "../data/refresh-token-repository";
import type { InMemoryUserRepository, UserRepository } from "../data/user-repository";

export type AuthAppDeps = {
  env: AuthEnv;
  users: UserRepository | InMemoryUserRepository;
  refreshTokens: RefreshTokenRepository | InMemoryRefreshTokenRepository;
};

export function createAuthApp(deps: AuthAppDeps): Hono {
  const app = new Hono();
  app.use(
    "*",
    cors({
      origin: (origin) => origin || "*",
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true, service: "auth" }));

  app.post(AuthRoutes.register, async (c) => {
    const body = (await c.req.json()) as Record<string, unknown>;
    try {
      const res = await registerUser(deps.users, {
        email: String(body.email ?? ""),
        password: String(body.password ?? ""),
        defaultEncryptionMode: body.defaultEncryptionMode as
          | import("@domidocs/contracts").RegisterRequest["defaultEncryptionMode"]
          | undefined,
      });
      return c.json(res, 201);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      const code =
        msg === "Email already registered"
          ? 409
          : msg.startsWith("Invalid") || msg.includes("short")
            ? 400
            : 400;
      return c.json({ error: msg }, code);
    }
  });

  app.post(AuthRoutes.login, async (c) => {
    const body = (await c.req.json()) as Record<string, unknown>;
    try {
      const res = await loginUser(
        deps.env,
        deps.users,
        deps.refreshTokens,
        {
          email: String(body.email ?? ""),
          password: String(body.password ?? ""),
        },
      );
      return c.json(res);
    } catch {
      return c.json({ error: "Invalid credentials" }, 401);
    }
  });

  app.post(AuthRoutes.refresh, async (c) => {
    const body = (await c.req.json()) as Record<string, unknown>;
    try {
      const res = await refreshSession(
        deps.env,
        deps.users,
        deps.refreshTokens,
        { refreshToken: String(body.refreshToken ?? "") },
      );
      return c.json(res);
    } catch {
      return c.json({ error: "Invalid refresh token" }, 401);
    }
  });

  app.get(AuthRoutes.jwks, async (c) => {
    try {
      const jwks = await buildJwksJson(deps.env);
      return c.json(jwks);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      return c.json({ error: msg }, 500);
    }
  });

  return app;
}
