# Capabilities, strengths, and limits

## Real capabilities

| Capability | Status | Evidence boundary |
| --- | --- | --- |
| Workflow evidence persistence | Available | Stored in PostgreSQL. |
| LLM workflow discovery | Available when configured | Calls the selected provider; missing keys return a real configuration error. |
| Command generation | Available | Produces a review draft only; no execution path is inferred. |
| API command execution | Available for controlled Acme target | Requires a reviewed API step and persists real state changes. |
| Dry run | Available | Validates command input and logs a dry-run execution without target side effects. |
| Threshold approvals | Available | Persists pending/approved/rejected approval records. |
| Drift checks | Available | Checks configured API route reachability and persists the result. |
| REST/MCP/OpenAPI | Available | Scoped API-key access with persisted audit events. |

## Strengths

- The core flow is small, traceable, and persisted end-to-end.
- The command boundary is safer after removing automatic target inference and browser fallback.
- Tenant-sensitive approval, drift, and target execution paths are scoped to a persisted organisation.
- The controlled target gives contributors a real integration surface without needing SaaS credentials.

## Weaknesses and next expansion candidates

- Production console auth is intentionally absent; design a pluggable, externally trusted authentication boundary first.
- Execution is one controlled target only. Add connectors one at a time behind tested adapter contracts, never catalog claims.
- There is no distributed work queue or distributed rate limiter. Introduce these only with an operational need and real deployment tests.
- API drift is route-level, not semantic contract validation. Add schema assertions once the connector contract is stable.
- Discovery quality depends on external model configuration; add evaluation fixtures from redacted real evidence before tuning prompts.
