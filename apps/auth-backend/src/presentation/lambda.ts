import { handle } from "hono/aws-lambda";
import { loadAuthEnv } from "../config";
import { RefreshTokenRepository } from "../data/refresh-token-repository";
import { UserRepository } from "../data/user-repository";
import { createAuthApp } from "./create-app.js";

const env = loadAuthEnv();
const users = new UserRepository(env.usersTableName);
const refreshTokens = new RefreshTokenRepository(env.refreshTokensTableName);
const app = createAuthApp({ env, users, refreshTokens });

export const handler = handle(app);
