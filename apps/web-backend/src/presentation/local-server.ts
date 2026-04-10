import { serve } from "@hono/node-server";
import { loadWebEnv } from "../config";
import { InMemoryDocumentRepository } from "../data/document-repository";
import { createWebApp } from "./create-app.js";

process.env.USE_IN_MEMORY_STORE = "true";
process.env.AUTH_JWKS_URL ??= "http://127.0.0.1:3001/.well-known/jwks.json";
process.env.JWT_ISSUER ??= "https://domidocs.local/auth";
process.env.JWT_AUDIENCE ??= "domidocs-api";

const env = loadWebEnv();
const documents = new InMemoryDocumentRepository();
const app = createWebApp({ env, documents });

serve({ fetch: app.fetch, port: 3002 }, (info) => {
  console.log(`Web backend listening on http://localhost:${info.port}`);
});
