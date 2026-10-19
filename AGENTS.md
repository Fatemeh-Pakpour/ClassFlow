# ClassFlow contributor instructions

## Project map

- `apps/web`: Next.js App Router frontend, React, Tailwind CSS, Auth0 sessions.
- `apps/api`: NestJS HTTP API, Auth0 bearer token verification, Zod configuration.
- `packages/db`: shared PostgreSQL client, Drizzle schema, SQL migrations.
- `infra`: Docker Compose backing services (PostgreSQL and RabbitMQ).
- `docs`: shared engineering documentation for humans and coding agents.

Read the relevant source and nearby tests before editing. Read scoped `AGENTS.md`
files when working in their directories. Follow existing conventions; propose
changes to architecture explicitly rather than introducing them incidentally.

## Read documentation by task

| Task | Read first |
| --- | --- |
| Cross-package change, new feature, dependency or service | `docs/architecture.md` |
| Login, sessions, tokens, protected routes or permissions | `docs/authentication.md` |
| Behavior change, bug fix or validation | `docs/testing.md` |
| Schema, query constraints, seed data or migration | `docs/database-migrations.md` |
| Change agent instructions or add a reusable workflow | `docs/ai-development.md` |

Read only the documents relevant to the task. Documentation describes the current
implementation unless explicitly marked as a proposal. Verify claims against code;
report discrepancies and update affected documentation with the implementation.

## Working rules

- Use pnpm and the root `package.json` packageManager version. Check package scripts
  before running commands; do not assume every package implements every script.
- Keep changes focused on the requested outcome. Preserve unrelated user changes.
- Reuse existing modules and helpers. Add dependencies only when they solve a
  concrete requirement that the current stack cannot reasonably handle.
- Preserve TypeScript checking. Avoid `any`, suppression comments and disabled
  checks as substitutes for fixing a type or design problem.
- Validate untrusted input at boundaries. Enforce access to protected resources in
  the API; frontend visibility and a valid login alone do not grant permission.
- Keep credentials, bearer tokens and session data out of source, logs and browser
  bundles. Read `.env.example` files for configuration names; do not expose `.env`
  contents. Update examples and environment validation when configuration changes.
- Do not apply migrations, seed shared databases, remove volumes or deploy as an
  incidental verification step. Use an explicitly identified disposable local/test
  target or the environment authorized by the user.
- For framework APIs that may differ by installed version, consult installed or
  official version-relevant documentation rather than relying on remembered APIs.
- Add meaningful regression coverage for behavior changes. Run checks appropriate
  to affected packages as described in `docs/testing.md`.
- Before finishing, review the diff for unrelated edits, secrets and stale docs.
  Report changed behavior, checks actually run and any remaining limitations.

## Common commands (repository root)

```sh
pnpm dev:web
pnpm dev:api
pnpm --filter @classflow/db build
pnpm --filter @classflow/api test
pnpm --filter @classflow/api test:e2e
pnpm lint
pnpm typecheck
pnpm build
```

`pnpm test` runs available package test scripts; it does not include the API's
separate `test:e2e` script or provide frontend/database test coverage.
