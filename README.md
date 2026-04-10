# Domidocs

Monorepo: React web app, auth API (Lambda), web BFF (Lambda), and AWS CDK split stacks.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) 9+
- AWS CLI + CDK bootstrap (for deploys)

## Local development

Terminal 1 — auth API (in-memory store, auto-generated JWT keys):

```bash
pnpm install
pnpm exec tsc -p packages/contracts/tsconfig.json
pnpm --filter @domidocs/auth-backend dev
```

Terminal 2 — web BFF:

```bash
pnpm --filter @domidocs/web-backend dev
```

Terminal 3 — web UI (proxies `/auth` and `/api` to the backends):

```bash
pnpm --filter @domidocs/web dev
```

Open `http://localhost:5173`, register, then log in. The home page calls the BFF `/api/me` using the access token in `sessionStorage`.

## CDK

```bash
cd infra/cdk
pnpm install
pnpm run build
pnpm exec cdk synth -c stage=dev
pnpm exec cdk deploy --all -c stage=dev
```

Stacks: `DomidocsStorage-*`, `DomidocsData-*`, `DomidocsAuthApi-*`, `DomidocsWebApi-*`, `DomidocsWebHosting-*`. Deploy data + storage before auth; deploy auth before web API.

### GitHub Actions

- **ci**: lint + build on push/PR.
- **deploy-*** workflows: `workflow_dispatch` only. Set secret **`AWS_ROLE_ARN`** (OIDC role) and variable **`AWS_REGION`**. For `deploy-web-static`, set **`WEB_BUCKET_NAME`** and **`WEB_DISTRIBUTION_ID`** from the hosting stack outputs.

## Layout

- `apps/web` — React (Vite)
- `apps/auth-backend` — Hono on Lambda
- `apps/web-backend` — Hono BFF on Lambda
- `packages/contracts` — shared types and route constants
- `infra/cdk` — infrastructure
