import * as path from "node:path";

/** Compiled stacks live in `infra/cdk/dist/lib`; repo root is four levels up. */
export const REPO_ROOT = path.join(__dirname, "../../../..");

export const authLambdaEntry = path.join(
  REPO_ROOT,
  "apps/auth-backend/src/presentation/lambda.ts",
);

export const webLambdaEntry = path.join(
  REPO_ROOT,
  "apps/web-backend/src/presentation/lambda.ts",
);

export const jwtKeyHandlerEntry = path.join(
  __dirname,
  "../../lambda/jwt-key-handler.ts",
);

export const pnpmLockfile = path.join(REPO_ROOT, "pnpm-lock.yaml");
