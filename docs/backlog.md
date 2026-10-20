# Engineering backlog

These tasks address gaps found while documenting the current implementation.
They are proposed work, not completed features. Priorities: P1 = address before
dependent feature work; P2 = address alongside the affected feature development.
Task IDs are local references for importing into a backlog tool.

## CF-001: Fix local PostgreSQL port mapping

Priority: P1
Dependencies: None

Problem: `infra/compose.yaml` maps host port 5433 to container port 5433, while
PostgreSQL uses its default container listening port of 5432.

Scope:
- Map the configurable host port to container port 5432.
- Check database connection examples for agreement with the host port.
- Update the architecture document after verifying the fix.

Acceptance criteria:
- The default mapping is `127.0.0.1:5433:5432`; a custom host port still works.
- PostgreSQL remains bound to localhost on the host.
- From the host, a connection using the documented local settings executes
  `SELECT 1` successfully.
- The API health endpoint succeeds against the real local database.
- Existing database volumes are preserved; verification does not delete data.

## CF-002: Add real PostgreSQL integration and migration tests

Priority: P1
Dependencies: CF-001 if using local Compose for the test database

Problem: API HTTP tests stub the database. No automated suite verifies actual
queries, constraints or migration execution.

Scope:
- Provide a dedicated disposable PostgreSQL 18 test database and an explicit
  integration-test command, separate from the fast mocked suites.
- Apply committed migrations to an empty database and exercise actual writes.
- Cover the users schema's case-insensitive email uniqueness, required values,
  status enum and generated identifiers/timestamps.
- Add an upgrade fixture for migrations that change existing data or constraints.

Acceptance criteria:
- A documented command creates or connects to an isolated test database, applies
  migrations and runs the integration suite with a nonzero exit on failure.
- Running the migration runner again without new migrations succeeds without
  changing existing data.
- Tests verify persisted results and expected constraint failures in PostgreSQL.
- Tests are repeatable and do not depend on execution order.
- Cleanup affects only resources explicitly created for this suite; configuration
  cannot silently fall back to a developer or production database.
- Documentation explains prerequisites and distinguishes integration tests from
  existing HTTP tests. Upgrade verification is required for relevant future changes.

## CF-003: Establish automated frontend tests

Priority: P2
Dependencies: None

Problem: The web package has lint/type checks but no automated behavior tests.

Scope:
- Select and configure a runner suited to the installed Next.js/React versions.
- Cover the existing signed-out and signed-in auth UI states with representative
  session fixtures, without contacting Auth0.
- Use browser tests where server rendering or navigation cannot be meaningfully
  exercised with component tests.

Acceptance criteria:
- The web package exposes a documented, non-interactive test command.
- Tests verify login/logout destinations and the displayed identity fallback
  behavior for signed-in users.
- Tests verify user-visible outcomes rather than private implementation details.
- No real credentials or Auth0 network calls are required for the mocked suite.
- `docs/testing.md` explains test scope and which rendering/navigation behavior
  requires browser coverage.

## CF-004: Implement and verify the server-side web-to-API authentication flow

Priority: P1
Dependencies: None; CF-003 provides a useful browser-test foundation

Problem: Web sessions and API token verification exist separately, but the web
does not yet implement an authenticated API caller or demonstrate the full flow.

Scope:
- Add a server-side API caller using the Auth0 access token for the configured API
  audience. Demonstrate it through a protected web route calling `/api/v1/me`.
- Define handling for missing sessions, expired sessions and API authentication
  failures without leaking tokens or internal errors.
- Document a dedicated non-production Auth0 test setup and full-flow verification.

Acceptance criteria:
- A signed-out visitor is sent through the intended login flow when accessing the
  protected route; a signed-in visitor can retrieve their API identity.
- The API identity matches the authenticated session's subject.
- Bearer tokens stay server-side and the browser access-token endpoint stays
  disabled; tokens are absent from rendered output, URLs and application logs.
- Automated tests cover success and session/API failure handling with controlled
  fixtures.
- A documented live check verifies login, authenticated API access and logout in
  the non-production environment. Expired-session behavior is verified as well.
- Test credentials are managed outside the repository. Live checks are clearly
  distinguished from mocked tests and do not block ordinary local unit tests.

## CF-005: Define and implement Auth0-to-database user mapping

Priority: P1
Dependencies: CF-002 for real persistence verification

Problem: The users table has no Auth0 subject mapping, and login does not currently
provision or resolve an application user.

Scope:
- Record a decision for identity keys, account provisioning and linking, required
  profile data and the relationship between Auth0 identity and local user status.
- Decide whether the trusted issuer must be part of the identity key; never use
  an unverified email address as an account-linking mechanism.
- Implement the chosen schema migration and server-side resolution/provisioning
  flow, including a safe policy for collisions with existing user emails.

Acceptance criteria:
- A decision record defines first-login behavior, missing profile data, duplicate
  email handling, suspended users and identity-provider failure behavior.
- Identity mapping is unique at the database level and derived from verified
  identity, not client-submitted claims.
- Repeated and concurrent provisioning attempts resolve to one application user.
- Existing users are handled according to an explicit migration/linking policy
  without silently merging accounts by email.
- Integration tests cover repeat provisioning, concurrency, collisions and local
  status handling. No placeholder profile values bypass existing constraints.
- `docs/authentication.md` describes the implemented lifecycle and remaining gaps.

## CF-006: Define the authorization policy for the first protected feature

Priority: P1
Dependencies: Product requirements for that feature

Problem: Valid tokens establish identity, but application access rules have not
been defined. Teacher/student roles are possible examples, not agreed requirements.

Scope:
- Select the first protected resource and confirm actual actors and actions.
- Define an actor/action/resource matrix, ownership or membership rules, and any
  tenant boundary required by the product.
- Decide where role/permission data lives and how revocation takes effect.

Acceptance criteria:
- A reviewed policy specifies who may create, read, update and delete the selected
  resource, including unauthenticated callers and authenticated non-members.
- The policy distinguishes application roles, token permissions and resource
  ownership rather than treating them as interchangeable.
- The policy defines suspended-user behavior, denial responses and any membership
  or role changes during an active session.
- Required schema/API changes and permitted public operations are identified.
- The decision is recorded under `docs/adr/`; unresolved product choices are
  explicit before enforcement is implemented.

## CF-007: Enforce authorization for the first protected feature

Priority: P1 before releasing that feature
Dependencies: CF-005, CF-006, and implementation of the selected resource

Problem: The global JWT guard verifies identity; it does not enforce resource-level
access. Returning permissions from `/me` does not grant or restrict access.

Scope:
- Implement the approved policy at the API boundary and in resource queries where
  appropriate, following existing NestJS dependency injection conventions.
- Derive the actor from verified identity and check access for reads and writes.
- Apply equivalent protection to list/search/bulk operations that exist in scope.

Acceptance criteria:
- Missing/invalid authentication produces 401; authenticated denials follow the
  agreed 403/404 policy and do not reveal protected resource information.
- Authorized actors can complete the intended operations.
- Changing a submitted resource ID, owner ID or membership ID cannot bypass access
  checks. List responses cannot expose resources outside the caller's access.
- Tests cover allowed actors, denied actors, cross-owner access and any applicable
  tenant boundary, including direct HTTP requests independent of the frontend.
- Existing auth challenge/error handling is preserved; UI visibility is never the
  sole access control.
- The documented policy matches the implemented checks and test cases.

## Suggested order

Start with CF-001 and CF-002. CF-003, CF-004 and the product policy work in CF-006
can proceed independently. Complete CF-005 before resource ownership depends on
local users, and complete CF-007 before releasing the selected protected feature.
