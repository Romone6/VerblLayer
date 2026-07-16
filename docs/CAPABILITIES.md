# Capabilities, strengths, and limits

## Real capabilities

| Capability | Status | Evidence boundary |
| --- | --- | --- |
| Workflow evidence persistence | Available | Stored in PostgreSQL. |
| LLM workflow discovery | Available when configured | Calls the selected provider; missing keys return a real configuration error. |
| Command generation | Available | Produces a review draft only; no execution path is inferred. |
| API command execution | Available for controlled Acme and Zendesk ticket updates | Uses the command's persisted app, reviewed method, and route template; unsupported providers return a real error. |
| Zendesk connection test | Available when configured | Calls Zendesk's live `/api/v2/users/me.json`; only server environment-variable names are persisted. |
| Dry run | Available | Validates command input and logs a dry-run execution without target side effects. |
| Threshold approvals | Available | Persists pending/approved/rejected approval records. |
| Drift checks | Available | Checks the persisted target app's configured API route reachability and persists the result. |
| Command versions | Available | Every publish creates an immutable persisted snapshot of the command contract and reviewed steps. |
| Repeated failure safety pause | Available | Three consecutive non-dry-run failures pause a published command and create an audit event. |
| REST/MCP/OpenAPI | Available | Scoped API-key access with persisted audit events. |

## Strengths

- The core flow is small, traceable, and persisted end-to-end.
- The command boundary is safer after removing automatic target inference and browser fallback.
- Tenant-sensitive approval, drift, and target execution paths are scoped to a persisted organisation.
- The controlled target gives contributors a real integration surface without needing SaaS credentials.

## Weaknesses and next expansion candidates

- Production console access works only behind a trusted identity proxy; this core intentionally provides no hosted login or user provisioning.
- Execution supports the controlled target and one narrow Zendesk ticket-update adapter. Add any future connector one at a time, with an explicit live contract and no catalog-only claim.
- There is no distributed work queue or distributed rate limiter. Introduce these only with an operational need and real deployment tests.
- API drift is route-level, not semantic contract validation. Add schema assertions once the connector contract is stable.
- Discovery quality depends on external model configuration; add evaluation fixtures from redacted real evidence before tuning prompts.
