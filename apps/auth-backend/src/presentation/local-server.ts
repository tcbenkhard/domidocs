import { serve } from "@hono/node-server";
import { generateKeyPairSync } from "node:crypto";
import { loadAuthEnv } from "../config";
import {
  InMemoryRefreshTokenRepository,
} from "../data/refresh-token-repository";
import { InMemoryUserRepository } from "../data/user-repository";
import { createAuthApp } from "./create-app.js";

process.env.USE_IN_MEMORY_STORE = "true";

const env = loadAuthEnv();
if (!env.jwtPublicKeyPem || !env.jwtPrivateKeyPem) {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  env.jwtPublicKeyPem = publicKey;
  env.jwtPrivateKeyPem = privateKey;
}

const users = new InMemoryUserRepository();
const refreshTokens = new InMemoryRefreshTokenRepository();
const app = createAuthApp({ env, users, refreshTokens });

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`Auth backend listening on http://localhost:${info.port}`);
});
