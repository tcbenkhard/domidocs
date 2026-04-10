import type { RefreshRequest, RefreshResponse } from "@domidocs/contracts";
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

function parseRefreshToken(composite: string): { tokenId: string; raw: string } {
  const i = composite.indexOf(".");
  if (i <= 0) throw new Error("Invalid refresh token");
  return { tokenId: composite.slice(0, i), raw: composite.slice(i + 1) };
}

export async function refreshSession(
  env: AuthEnv,
  users: UserRepository | InMemoryUserRepository,
  refreshTokens: RefreshTokenRepository | InMemoryRefreshTokenRepository,
  body: RefreshRequest,
): Promise<RefreshResponse> {
  const { tokenId, raw } = parseRefreshToken(body.refreshToken);
  const consumed = await refreshTokens.consume(tokenId, raw);
  if (!consumed) {
    throw new Error("Invalid refresh token");
  }
  await refreshTokens.delete(tokenId);
  const user = await users.getById(consumed.userId);
  if (!user) {
    throw new Error("Invalid refresh token");
  }
  const accessToken = await signAccessToken(env, user.userId, user.email);
  const next = newRefreshTokenRaw();
  const nowSec = Math.floor(Date.now() / 1000);
  await refreshTokens.save({
    tokenId: next.tokenId,
    userId: user.userId,
    tokenHashB64: hashRefreshToken(next.raw),
    expiresAtEpochSec: nowSec + refreshTtlSeconds(),
    createdAt: new Date().toISOString(),
  });
  return {
    accessToken,
    refreshToken: `${next.tokenId}.${next.raw}`,
    expiresInSeconds: accessTtlSeconds(),
    tokenType: "Bearer",
  };
}
