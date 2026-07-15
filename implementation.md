# VerblLayer implementation tracker

Last updated: 2026-07-15

## Open-source core pivot

| Phase | Status | Result |
| --- | --- | --- |
| Preserve baseline and choose public scope | Complete | Original implementation preserved at git commit `e9f16d1`; active branch is `open-source-core`. |
| Make the product truthful | Complete | Candidate generation is review-first; it no longer invents Acme routes, browser steps, or refund-specific success rules. Publishing requires an explicit reviewed API step. |
| Simplify runtime and schema | Complete, pending migration application | Removed Clerk/SSO/SCIM, Redis workers, browser fallback, third-party connectors, compliance/cron/SLO/auto-send surfaces and their schema models. Added destructive migration `20260715000000_open_source_core`. |
| Secure core boundaries | Complete | Approvals and drift checks are organisation-scoped; internal target resolves organisation from the persisted execution rather than a client header; production rejects local auth. |
| Open-source packaging | Complete | MIT license, public package flag, README, runbook, contributor guidance, capabilities audit, and a single Postgres Docker service. |
| Test and release gate | In progress | Lint, TypeScript, build, and unit tests pass. Docker Desktop reports `hasNoVirtualization=true`, so migrations, database integrations, and Playwright remain to be rerun. |

## Current core flow

1. Seed or create a persisted workspace and register a target app.
2. Store real workflow evidence and use a configured discovery provider.
3. Review and accept candidate; generate a command draft.
4. Add a reviewed API route and command schemas; publish only when a valid route is present.
5. Call through dashboard, REST, or MCP; log success/failure against real target state.
6. Require approval for configured amount thresholds and store approval/audit records.
7. Run API-route drift checks and persist health.

## Known limitations

- The public core deliberately has no production web authentication. Use a trusted external auth proxy until a pluggable auth module is designed and reviewed.
- Only the controlled Acme target is executable today. Custom/API-schema targets may hold evidence but do not gain implied execution support.
- Discovery needs an OpenAI, Anthropic, or OpenRouter API key. Missing configuration is an unavailable capability, not a fallback result.
- The in-process limiter is suitable for a single instance only; use a gateway for distributed deployments.
- The destructive pivot migration has not been applied or integration-verified in this Docker-unavailable environment.

## Verification record

- 2026-07-15: `pnpm install --lockfile-only` passed.
- 2026-07-15: `pnpm prisma:generate` passed after schema simplification.
- 2026-07-15: `npm.cmd run lint` passed.
- 2026-07-15: `npx.cmd tsc --noEmit` passed.
- 2026-07-15: `npm.cmd run build` passed.
- 2026-07-15: all unit tests passed (8 files, 19 tests).
- 2026-07-15: Docker Desktop reported `Status=stopped` and `hasNoVirtualization=true`; no Postgres integration, migration deployment, or Playwright result is claimed.
