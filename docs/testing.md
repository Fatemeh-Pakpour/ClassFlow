# Testing and verification

Run commands below from the repository root. Package scripts are authoritative.

| Check | Command | Scope |
| --- | --- | --- |
| API unit tests | `pnpm --filter @classflow/api test` | Vitest `*.spec.ts` |
| API HTTP tests | `pnpm --filter @classflow/api test:e2e` | Separate Vitest `*.e2e-spec.ts` config |
| API lint / types | `pnpm --filter @classflow/api lint` / `pnpm --filter @classflow/api typecheck` | oxlint / TypeScript |
| Web lint / types | `pnpm --filter @classflow/web lint` / `pnpm --filter @classflow/web typecheck` | ESLint / TypeScript |
| Web build | `pnpm build:web` | Next.js production build |
| DB types / build | `pnpm --filter @classflow/db typecheck` / `pnpm --filter @classflow/db build` | TypeScript and exported artifacts |
| Migration consistency | `pnpm db:check` | Drizzle migration history check |
| Workspace checks | `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test` | Available package scripts |

## Existing coverage and limits

`.github/workflows/ci.yml` runs dependency installation, workspace lint/type checks,
API unit and HTTP tests, and the API build on pushes and pull requests. It does not
deploy or apply migrations. Frontend production builds and live Auth0/database
integration are not covered by that workflow.

API unit tests cover the JWT guard and health controller. HTTP tests instantiate
`AppModule`, apply the real `configureApp` and override the database provider with
a stub. They check health, security headers, CORS and rejection of missing/malformed
tokens. They do not verify real queries, migrations or live Auth0 login/token issuance.
The HTTP config supplies test environment values and does not require local secrets.

There is no frontend test runner, database integration suite or browser automation
configured. Root `pnpm test` does not run the separately named API HTTP suite.
Do not claim coverage beyond the checks that actually ran.

## Choosing checks

- API behavior: add a regression test for the observable change; run relevant unit
  tests, API lint and typecheck. Run HTTP tests for routes, guards or HTTP setup.
- Web behavior: run web lint and typecheck; build when rendering/routing/configuration
  changes. Check affected UI states and keyboard behavior manually where possible.
  Add an appropriate test setup when feature risk warrants it; report current gaps.
- Database changes: run DB typecheck/build and migration consistency checks. For SQL
  behavior, use disposable PostgreSQL and verify real constraints and existing-data
  migration behavior. Never substitute mocks for proof of database correctness.
- Shared package changes: build the package and check affected consumers.
- Documentation only: check links, referenced paths, commands and consistency with
  the implementation. Application test runs are unnecessary unless code also changes.

Prefer tests of contracts and outcomes over private method calls or duplicated
implementation. Include negative and boundary cases relevant to the change.
Report environmental failures separately from code failures; do not disable a
check or weaken an assertion to make verification pass.
