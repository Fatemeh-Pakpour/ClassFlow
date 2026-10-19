# Architecture

## Scope and status

This document covers the entire monorepo. It records implemented structure, not a
completed product design. The web landing page is still largely starter content.

| Area | Current implementation | Entry points |
| --- | --- | --- |
| Web | Next.js App Router, React, Tailwind, Auth0 server sessions | `apps/web/src/app`, `apps/web/src/proxy.ts` |
| API | NestJS, global JWT guard, Zod environment validation, health and identity endpoints | `apps/api/src/app.module.ts`, `apps/api/src/app.setup.ts` |
| Database | PostgreSQL, Drizzle client/schema and SQL migration history | `packages/db/src`, `packages/db/drizzle` |
| Infrastructure | Local PostgreSQL and RabbitMQ containers | `infra/compose.yaml` |

## Boundaries

The browser renders the web UI. Auth0 middleware manages web authentication and
sessions. The API independently validates bearer access tokens before allowing
protected requests. The API consumes `@classflow/db`; the web app does not currently
depend on that package. Keep protected business operations in the API.

The database package owns schema definitions, connection construction and migration
artifacts. Its public exports resolve to `dist`, so build it before consumers need
updated exports. Root installation builds it through `postinstall`.

RabbitMQ is provisioned locally and its URL is required by API configuration, but
there is no messaging module or worker application in the current source tree.
Do not describe asynchronous workflows as implemented.

## API conventions

`configureApp` configures Helmet, CORS, `/api` prefix and URI versioning. Most routes
default to version 1. `/api/health` is public and version neutral; `/api/v1/me` is
protected. The health check currently checks the database, not RabbitMQ.

`AppModule` registers `JwtAuthGuard` and `StandardSchemaValidationPipe` through DI.
Environment configuration is validated with Zod at startup. Follow these boundaries
when adding routes and configuration; inspect the installed NestJS version's APIs.

## Development configuration

Use `.env.example` files in `apps/web`, `apps/api`, `packages/db` and `infra` to
prepare local configuration without committing credentials. Root scripts start
apps and infrastructure independently. Consult the corresponding package scripts
for the actual commands and the lockfile for resolved dependency versions.

Infrastructure caveat: Compose currently maps PostgreSQL host port 5433 to container
port 5433 without configuring a non-default PostgreSQL listening port. Verify and
resolve that configuration before relying on host database connectivity. A passing
in-container health check alone does not prove host connectivity.

## Decisions and evolution

Record significant decisions in `docs/decisions/` using the template there: new
services, changes to package responsibilities, identity mapping, authorization,
API contracts or deployment strategy. Label proposals explicitly and update this
document once the decision is implemented.
