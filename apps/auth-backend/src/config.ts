export type AuthEnv = {
  stage: string;
  usersTableName: string;
  refreshTokensTableName: string;
  jwtIssuer: string;
  jwtAudience: string;
  jwtPrivateKeySecretArn: string;
  /** Optional inline PEM for local dev only; production uses SSM parameter. */
  jwtPrivateKeyPem: string;
  jwtPublicKeyPem: string;
  /** SSM parameter name holding SPKI PEM (production). */
  jwtPublicKeyParamName: string;
  /** When true, skip AWS and use in-memory stores (local only). */
  useInMemoryStore: boolean;
};

export function loadAuthEnv(): AuthEnv {
  const useInMemoryStore = process.env.USE_IN_MEMORY_STORE === "true";
  return {
    stage: process.env.STAGE ?? "dev",
    usersTableName: process.env.USERS_TABLE_NAME ?? "",
    refreshTokensTableName: process.env.REFRESH_TOKENS_TABLE_NAME ?? "",
    jwtIssuer: process.env.JWT_ISSUER ?? "https://domidocs.local/auth",
    jwtAudience: process.env.JWT_AUDIENCE ?? "domidocs-api",
    jwtPrivateKeySecretArn: process.env.JWT_PRIVATE_KEY_SECRET_ARN ?? "",
    jwtPrivateKeyPem: process.env.JWT_PRIVATE_KEY_PEM ?? "",
    jwtPublicKeyPem: process.env.JWT_PUBLIC_KEY_PEM ?? "",
    jwtPublicKeyParamName: process.env.JWT_PUBLIC_KEY_PARAM_NAME ?? "",
    useInMemoryStore,
  };
}
