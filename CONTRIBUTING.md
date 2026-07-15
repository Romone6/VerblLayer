# Contributing

Run `pnpm lint`, `pnpm test`, and the relevant integration/e2e checks before opening a pull request. Do not add mocks that imitate command discovery, execution, audit logs, metrics, or drift health. When a capability is unavailable, return that state and document it.

Keep changes focused. New execution support must include a real target contract, server-side validation, organisation scoping, audit records, and tests against persisted state.
