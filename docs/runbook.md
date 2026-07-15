# Local runbook

## Setup

```powershell
pnpm install
Copy-Item .env.example .env
pnpm db:up
pnpm prisma:migrate:deploy
pnpm prisma:seed
pnpm dev
```

Postgres is the only required container and is exposed at `localhost:55432`. `DEV_AUTH_ENABLED=true` is only for local development and test; production startup rejects it. Set a long `INTERNAL_EXECUTION_TOKEN` before exposing a controlled target.

## Real smoke flow

1. Register the local Acme Support Admin target at `/apps` and run its real `/api/health` connection test.
2. Upload real SOP, CSV, trace, or process text at `/discovery-sources`.
3. Run discovery at `/discover-commands` with a configured provider key. If absent, the UI/API reports discovery as unavailable.
4. Accept a real candidate. Generated commands intentionally contain no execution step.
5. On the command page, add an API step such as `/api/internal/acme/refunds`, review schemas/risk/approval threshold, then publish.
6. Run with an amount below the threshold; run above the threshold and approve it at `/approvals`.
7. Inspect `/executions`, `/drift-monitor`, and `/audit-logs`.

## Agent API / MCP

Create a scoped API key in `/mcp-api`, then call:

```powershell
$headers = @{ Authorization = "Bearer <api_key>"; "Content-Type" = "application/json"; "x-idempotency-key" = "demo-1" }
Invoke-WebRequest -Method Post -Uri "http://localhost:3100/api/mcp" -Headers $headers -Body '{"tool":"list_commands","args":{}}'
Invoke-WebRequest -Method Get -Uri "http://localhost:3100/api/v1/openapi"
```

## Verification

```powershell
pnpm lint
pnpm test
pnpm build
pnpm playwright:test
pnpm verify
```

Use `pnpm prisma:migrate:deploy`, never `prisma migrate dev`, for a shared database. The `20260715000000_open_source_core` migration intentionally drops enterprise-only tables; take a backup before applying it to any retained database.
