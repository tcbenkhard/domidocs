import { EncryptionMode, WebApiRoutes } from "@domidocs/contracts";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createJwtAuthMiddleware } from "../application/jwt-middleware";
import { createDocument } from "../application/create-document";
import type { WebEnv } from "../config";
import type { DocumentRepository, InMemoryDocumentRepository } from "../data/document-repository";

export type WebAppDeps = {
  env: WebEnv;
  documents: DocumentRepository | InMemoryDocumentRepository;
};

export function createWebApp(deps: WebAppDeps): Hono {
  const app = new Hono();
  app.use(
    "*",
    cors({
      origin: (origin) => origin || "*",
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  );

  app.get(WebApiRoutes.health, (c) =>
    c.json({ ok: true, service: "web-backend", stage: deps.env.stage }),
  );

  const authed = new Hono();
  authed.use(
    "*",
    createJwtAuthMiddleware({
      issuer: deps.env.jwtIssuer,
      audience: deps.env.jwtAudience,
      jwksUrl: deps.env.authJwksUrl,
    }),
  );
  authed.get(WebApiRoutes.me, (c) => {
    const user = c.get("user");
    return c.json({ userId: user.userId, email: user.email });
  });
  authed.post(WebApiRoutes.documents, async (c) => {
    const user = c.get("user");
    const body = (await c.req.json()) as Record<string, unknown>;
    const encryptionMode = body.encryptionMode as EncryptionMode | undefined;
    if (encryptionMode !== EncryptionMode.Backend && encryptionMode !== EncryptionMode.Client) {
      return c.json({ error: "encryptionMode required" }, 400);
    }
    const res = await createDocument(deps.env, deps.documents, user.userId, {
      encryptionMode,
      contentType: body.contentType as string | undefined,
      tags: Array.isArray(body.tags) ? (body.tags as string[]) : undefined,
    });
    return c.json(res, 201);
  });
  authed.get(WebApiRoutes.documents, async (c) => {
    const user = c.get("user");
    const items = await deps.documents.listForUser(user.userId);
    return c.json({ items });
  });

  app.route("/", authed);

  return app;
}
