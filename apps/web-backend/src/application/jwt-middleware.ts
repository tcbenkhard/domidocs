import type { MiddlewareHandler } from "hono";
import * as jose from "jose";

export type AuthedUser = {
  userId: string;
  email: string;
};

declare module "hono" {
  interface ContextVariableMap {
    user: AuthedUser;
  }
}

const jwksCache = new Map<
  string,
  ReturnType<typeof jose.createRemoteJWKSet>
>();

function getJwks(jwksUrl: string): ReturnType<typeof jose.createRemoteJWKSet> {
  const hit = jwksCache.get(jwksUrl);
  if (hit) return hit;
  const jwks = jose.createRemoteJWKSet(new URL(jwksUrl));
  jwksCache.set(jwksUrl, jwks);
  return jwks;
}

export function createJwtAuthMiddleware(options: {
  issuer: string;
  audience: string;
  jwksUrl: string;
}): MiddlewareHandler {
  return async (c, next) => {
    const auth = c.req.header("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const JWKS = getJwks(options.jwksUrl);
      const { payload } = await jose.jwtVerify(token, JWKS, {
        issuer: options.issuer,
        audience: options.audience,
      });
      const sub = payload.sub;
      const email = payload.email;
      if (typeof sub !== "string" || typeof email !== "string") {
        return c.json({ error: "Unauthorized" }, 401);
      }
      c.set("user", { userId: sub, email });
      await next();
    } catch {
      return c.json({ error: "Unauthorized" }, 401);
    }
  };
}
