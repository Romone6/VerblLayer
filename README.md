# VerblLayer

VerblLayer is an open-source, self-hosted command layer for business software. It turns real workflow evidence into reviewed, agent-callable commands, then executes only against a real controlled target with approvals, audit records, and drift checks.

It does not simulate workflow discovery, execution, dashboard statistics, audit records, or command health.

## What the public core includes

- Persisted PostgreSQL workspaces, workflow evidence, candidates, commands, executions, approvals, drift checks, audit logs, and scoped API keys.
- Provider-backed workflow discovery. A missing provider key is reported as unavailable; a candidate is never fabricated.
- Explicit API execution steps. Generation creates an unpublishable review draft; an operator must supply a reviewed target route before publishing.
- A real controlled Acme Support Admin target, with persistent customer, ticket, and refund state.
- REST, MCP, and OpenAPI surfaces for scoped agent access.

## Intentionally out of scope

Hosted authentication, SSO/SCIM, custom roles, Redis/BullMQ workers, browser/RPA fallback, third-party connector claims, auto-send simulation, compliance exports, cron/JWKS, SLO dashboards, and marketing-only product claims were removed in the open-source pivot.

## Quick start (PowerShell)

```powershell
pnpm install
Copy-Item .env.example .env
pnpm db:up
pnpm prisma:migrate:deploy
pnpm prisma:seed
pnpm dev
```

Open `http://localhost:3100`. `DEV_AUTH_ENABLED=true` is development-only and resolves the persisted seeded operator. It is rejected in production. Put a real external authentication boundary in front of the web console before exposing it.

## Verify

```powershell
pnpm verify
```

The complete gate requires Docker/Postgres and a Playwright-capable browser. For the exact operating flow and current limitations, see [docs/runbook.md](docs/runbook.md), [implementation.md](implementation.md), and [docs/CAPABILITIES.md](docs/CAPABILITIES.md).

## License

[MIT](LICENSE)
