import * as jose from "jose";
import type { AuthEnv } from "../config";
import { getJwtPrivateKeyPem } from "../data/secrets";
import { getPublicKeyPemFromSsm } from "../data/ssm-public-key";

const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_SEC = 30 * 24 * 60 * 60;

export function accessTtlSeconds(): number {
  return ACCESS_TTL_SEC;
}

export function refreshTtlSeconds(): number {
  return REFRESH_TTL_SEC;
}

export async function signAccessToken(
  env: AuthEnv,
  userId: string,
  email: string,
): Promise<string> {
  const pem = env.jwtPrivateKeyPem
    ? env.jwtPrivateKeyPem
    : await getJwtPrivateKeyPem(env.jwtPrivateKeySecretArn);
  const key = await jose.importPKCS8(pem, "RS256");
  return await new jose.SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(env.jwtIssuer)
    .setAudience(env.jwtAudience)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(key);
}

export async function buildJwksJson(env: AuthEnv): Promise<{ keys: jose.JWK[] }> {
  const publicPem = env.jwtPublicKeyPem
    ? env.jwtPublicKeyPem
    : await getPublicKeyPemFromSsm(env.jwtPublicKeyParamName);
  if (!publicPem) throw new Error("JWT public key is not configured");
  const key = await jose.importSPKI(publicPem, "RS256");
  const jwk = await jose.exportJWK(key);
  jwk.kid = "domidocs-1";
  jwk.use = "sig";
  jwk.alg = "RS256";
  return { keys: [jwk as jose.JWK] };
}
