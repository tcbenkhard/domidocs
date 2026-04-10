import { randomUUID } from "node:crypto";

export function newUserId(): string {
  return randomUUID();
}

export function newRefreshTokenId(): string {
  return randomUUID();
}
