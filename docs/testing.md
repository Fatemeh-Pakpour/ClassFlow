# Testing and verification

Run commands below from the repository root. Package scripts are authoritative.

| Check | Command | Scope |
| --- | --- | --- |
| API unit tests | `pnpm --filter @classflow/api test` | Vitest `*.spec.ts` |
| API HTTP tests | `pnpm --filter @classflow/api test:e2e` | Separate Vitest `*.e2e-spec.ts` config |
| API lint / types | `pnpm --filter @classflow/api lint` / `pnpm --filter @classflow/api typecheck` | oxlint / TypeScript |
| Web unit tests | `pnpm --filter @classflow/web test` | Vitest `src/**/*.test.ts` |
| Web lint / types | `pnpm --filter @classflow/web lint` / `pnpm --filter @classflow/web typecheck` | ESLint / TypeScript |
| Web build | `pnpm build:web` | Next.js production build |
| Web end-to-end | `pnpm --filter @classflow/web test:e2e` | Playwright against the live Auth0 development tenant; local only |
| DB types / build | `pnpm --filter @classflow/db typecheck` / `pnpm --filter @classflow/db build` | TypeScript and exported artifacts |
| PostgreSQL integration | `pnpm test:integration` | `*.integration-spec.ts` in `packages/db/test` and `apps/api/test`; needs `TEST_DATABASE_ADMIN_URL` |
| Migration consistency | `pnpm db:check` | Drizzle migration history check |
| Workspace checks | `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test` | Available package scripts |

## Existing coverage and limits

`.github/workflows/ci.yml` runs dependency installation, workspace lint/type checks,
API unit and HTTP tests, PostgreSQL integration tests against a PostgreSQL 18 service
container, and the API build on pushes and pull requests. It does not deploy or apply
migrations to any shared database. Frontend production builds and live Auth0 are not
covered by that workflow.

## PostgreSQL integration tests

`pnpm test:integration` runs each package's `test:integration` script. Every test
file creates its own `classflow_test_<random>` database through
`@classflow/db/testing`, applies the committed migrations and drops the database
(`WITH (FORCE)`) afterwards, so files are isolated and order-independent. Within a
file, tests truncate the tables they use in `beforeEach`.

`TEST_DATABASE_ADMIN_URL` is a maintenance connection to a disposable server, used
only to create and drop those databases; its role needs `CREATEDB`. There is no
fallback to `DATABASE_URL`: an unset variable fails the run. Locally, start
`pnpm infra:up` and set it in `packages/db/.env` and `apps/api/.env` (see their
`.env.example`), pointing at the `postgres` maintenance database of the Compose server.
Never point it at a shared or production server.

- `packages/db/test/migrations.integration-spec.ts`: all migrations apply to an
  empty database, re-running the migrator is a no-op that leaves data unchanged, and
  rows inserted before `0001` and `0002` survive the later status, length and Auth0
  subject migrations.
- `packages/db/test/users.integration-spec.ts`: UUIDv7 ids and timestamps,
  case-insensitive email uniqueness and `userEmailEquals`, Auth0 subject uniqueness
  with multiple nulls, required columns, the status enum and length limits.
- `apps/api/test/users.integration-spec.ts`: `UsersService` and `UsersRepository`
  on real PostgreSQL: repeat registration, translation of the real email
  constraint violation, concurrent same-subject registration resolving to one user,
  and concurrent different-subject email claims leaving one winner.

These tests do not start the HTTP app or contact Auth0.

API unit tests cover the JWT guard and health controller. HTTP tests instantiate
`AppModule`, apply the real `configureApp` and override the database provider with
a stub. They check health, security headers, CORS and rejection of missing/malformed
tokens. They do not verify real queries, migrations or live Auth0 login/token issuance.
The HTTP config supplies test environment values and does not require local secrets.

Repository unit tests verify that PostgreSQL email uniqueness violations (direct
or wrapped by Drizzle) become a neutral `EmailAlreadyExistsError`, while other
failures propagate unchanged. Registration HTTP tests exercise the real service's
translation into a registration conflict or same-subject race recovery.

`users.e2e-spec.ts` tests registration through the real global guard and schema
pipe, with a controlled token verifier and stubbed repository. It covers body
validation, subject ownership, verified-email claims, active status, repeated calls, the insert-race
recovery path, database-reported email conflicts, and generic 500
responses for unexpected persistence failures. Real PostgreSQL concurrency/constraint behavior
is covered by the integration suite below; live Auth0 verification is not. Registration
coverage also checks missing/false/malformed claims are rejected before database
access, unrelated authenticated routes remain accessible, client email is rejected,
and same-subject races recover after insert email conflicts. Registration does not
query email availability before insertion; the database unique constraint is authoritative.

`apps/web/e2e` holds Playwright tests for the login and signup flows. They run a
real browser against `localhost:3000` (starting `pnpm dev` unless it is already
running) and the hosted Auth0 Universal Login pages of the development tenant:
signed-out state, redirect to Auth0, wrong-password rejection, successful login,
session persistence across reload, logout, the signup form, the tenant password
policy and rejection of an already-registered email. `auth.setup.ts` logs in once
and saves the session to `apps/web/playwright/.auth/` (git-ignored; it holds a live
cookie) for the `logged-in` project.

Set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` in `apps/web/.env.local` for a dedicated,
email-verified test user, and install the browser once with
`pnpm --filter @classflow/web exec playwright install chromium`. Tests run serially and
make one wrong-password attempt per run; repeated failures can trigger Auth0
brute-force protection for that user. Successful signup is not covered because it
would create a real tenant user on every run. These tests are not in CI (they need
the tenant and credentials), do not exercise the API or database, and do not cover
Google login or email verification.

Environment schemas have unit tests in both apps: `apps/api/src/infrastructure/config/env.schema.spec.ts`
and `apps/web/src/lib/env.schema.test.ts` (Vitest, `pnpm --filter @classflow/web test`).
They cover missing and malformed variables, error reporting and the production-only
rules. Startup behavior (the API refusing to boot, `next start` exiting) was checked
manually and is not automated.

There are no frontend component tests. Root `pnpm test` runs neither the API HTTP
suite, the PostgreSQL integration suite nor the web end-to-end suite.
Do not claim coverage beyond the checks that actually ran.

## Choosing checks

- API behavior: add a regression test for the observable change; run relevant unit
  tests, API lint and typecheck. Run HTTP tests for routes, guards or HTTP setup.
- Web behavior: run web lint and typecheck; build when rendering/routing/configuration
  changes. Check affected UI states and keyboard behavior manually where possible.
  Add an appropriate test setup when feature risk warrants it; report current gaps.
- Database changes: run DB typecheck/build, migration consistency checks and
  `pnpm test:integration`. Add integration cases for new constraints and an upgrade
  case for migrations that change existing data. Never substitute mocks for proof
  of database correctness.
- Shared package changes: build the package and check affected consumers.
- Documentation only: check links, referenced paths, commands and consistency with
  the implementation. Application test runs are unnecessary unless code also changes.

Prefer tests of contracts and outcomes over private method calls or duplicated
implementation. Include negative and boundary cases relevant to the change.
Report environmental failures separately from code failures; do not disable a
check or weaken an assertion to make verification pass.
