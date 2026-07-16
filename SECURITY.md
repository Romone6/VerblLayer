# Security policy

## Reporting a vulnerability

Do not file vulnerabilities in public issues, pull requests, Discussions, or chat.

Before public publication, the repository owner must replace this paragraph with a monitored private reporting address or GitHub Security Advisories contact. Until that contact exists, VerblLayer is not ready for public release.

A useful report includes the affected commit, attack preconditions, a minimal reproduction, impact, and redacted logs. Do not include API keys, database URLs, proxy secrets, customer records, or other credentials.

## Supported deployment posture

The web console requires a trusted identity proxy in production. The proxy must strip client-supplied `x-verblayer-*` headers and inject the authenticated organisation, email, and shared secret. VerblLayer resolves only existing users and stored roles; it does not provision users from headers.

Use `next build` and `next start` for production, keep credentials server-side, and put a rate-limiting reverse proxy or equivalent edge layer in front of public deployments. See [docs/runbook.md](docs/runbook.md) for the deployment contract.
