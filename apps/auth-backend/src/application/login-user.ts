import type { LoginRequest, LoginResponse } from "@domidocs/contracts";
import { verifyPassword } from "../business/password";
import type { AuthEnv } from "../config";
import {
  hashRefreshToken,
  newRefreshTokenRaw,
  type InMemoryRefreshTokenRepository,
  type RefreshTokenRepository,
} from "../data/refresh-token-repository";
import type { InMemoryUserRepository, UserRepository } from "../data/user-repository";
import {
  accessTtlSeconds,
  refreshTtlSeconds,
  signAccessToken,
} from "./jwt-service.js";

export async function loginUser(
  env: AuthEnv,
  users: UserRepository | InMemoryUserRepository,
  refreshTokens: RefreshTokenRepository | InMemoryRefreshTokenRepository,
  body: LoginRequest,
): Promise<LoginResponse> {
  const email = body.email.trim().toLowerCase();
  const user = await users.findByEmail(email);
  if (!user) {
    throw new Error("Invalid credentials");
  }
  const ok = await verifyPassword(body.password, user.password);
  if (!ok) {
    throw new Error("Invalid credentials");
  }
  const accessToken = await signAccessToken(env, user.userId, user.email);
  const { tokenId, raw } = newRefreshTokenRaw();
  const nowSec = Math.floor(Date.now() / 1000);
  await refreshTokens.save({
    tokenId,
    userId: user.userId,
    tokenHashB64: hashRefreshToken(raw),
    expiresAtEpochSec: nowSec + refreshTtlSeconds(),
    createdAt: new Date().toISOString(),
  });
  const refreshToken = `${tokenId}.${raw}`;
  return {
    accessToken,
    refreshToken,
    expiresInSeconds: accessTtlSeconds(),
    tokenType: "Bearer",
  };
}
