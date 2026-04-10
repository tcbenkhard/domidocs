export type WebEnv = {
  stage: string;
  documentsTableName: string;
  documentsBucketName: string;
  jwtIssuer: string;
  jwtAudience: string;
  /** Full URL to auth JWKS (e.g. https://xxx.execute-api.../.well-known/jwks.json) */
  authJwksUrl: string;
  /** When true, use in-memory document store and skip S3 presign. */
  useInMemoryStore: boolean;
};

export function loadWebEnv(): WebEnv {
  return {
    stage: process.env.STAGE ?? "dev",
    documentsTableName: process.env.DOCUMENTS_TABLE_NAME ?? "",
    documentsBucketName: process.env.DOCUMENTS_BUCKET_NAME ?? "",
    jwtIssuer: process.env.JWT_ISSUER ?? "https://domidocs.local/auth",
    jwtAudience: process.env.JWT_AUDIENCE ?? "domidocs-api",
    authJwksUrl: process.env.AUTH_JWKS_URL ?? "",
    useInMemoryStore: process.env.USE_IN_MEMORY_STORE === "true",
  };
}
