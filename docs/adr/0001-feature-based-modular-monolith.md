# 0001: Organize the API as a feature-based modular monolith

Status: Accepted
Date: 2026-10-20

## Context

ClassFlow has a Next.js web application, a NestJS API and a shared Drizzle database
package. Business features will grow, but separate service deployments would add
operational and consistency work before there is an established need.

## Decision

Group API business capabilities in `src/modules` and technical adapters in
`src/infrastructure`. Identity owns existing authentication and `/me`. Health is
operational infrastructure. Keep HTTP application assembly in AppModule and
configureApp. Preserve public routes and authentication behavior during the move.

Keep database schema/migrations in `packages/db`. Share business behavior through
explicit Nest module exports; modules own their data access and invariants.
Keep web routing in `app`, business UI in `features` and generic UI in `components`.

Use `docs/architecture` for explanations and `docs/adr` for decisions. Add worker,
contracts, shared configuration packages and other adapters when working consumers
need them. Do not register empty feature modules to imply implemented capabilities.

## Alternatives considered

- Microservices now: adds deployment, messaging and distributed transaction concerns
  before module boundaries and scaling needs are established.
- Shared technical folders for all controllers/services: disperses each business
  change across the codebase and makes ownership less visible.
- Full layered/domain architecture for every module: adds indirection without a
  current domain requirement. Complex features can introduce internal layers later.

## Consequences

One API deployment remains straightforward while feature ownership becomes explicit.
Boundaries require review; directory structure does not prevent deep imports or
cross-module writes. A future worker must reuse extracted application capabilities
rather than import API bootstrap code or start the entire HTTP app.

## Evidence

- [NestJS module encapsulation](https://docs.nestjs.com/modules)
- [Next.js project organization](https://nextjs.org/docs/app/getting-started/project-structure)
