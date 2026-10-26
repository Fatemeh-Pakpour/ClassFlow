# 0002: Enforce application roles and resource rules in the API

Status: Proposed
Date: 2026-10-26

## Context

The global `JwtAuthGuard` establishes identity only. No role model, ownership check
or permission enforcement exists, and `/me` returning a `permissions` claim does
not restrict access (CF-006, CF-007 in `docs/backlog.md`). Product features such as
classes and bookings need rules like "an admin can do this; a student cannot".

The roles, resources and actions below are a starting proposal for product review,
not agreed requirements. Nothing in this document is implemented yet.

## Decision

### Where data and rules live

- Auth0 remains the identity provider. Application roles are stored in PostgreSQL
  next to the local account, owned by the `users` module, so role changes and
  suspension take effect on the next request rather than at token expiry.
- Each user has exactly one global role: `admin`, `teacher` or `student`. New
  accounts default to `student`. Registration and request bodies never set a role.
- Authorization is enforced in the API in two places:
  - Role checks: a route-level guard and decorator resolve the caller's local
    account from the verified `sub`, reject missing or non-`active` accounts and
    compare the role with the route's required roles.
  - Resource rules: ownership and membership checks run in the owning module's
    application service as policy functions, and list queries are scoped to the
    caller's accessible rows.
- The actor is always derived from the verified token. Submitted user, owner or
  membership IDs never grant access.
- The web app may hide controls based on the role the API reports; that is
  presentation only.

### Proposed access matrix

"Own" means the caller is the booking's student or the class's teacher.

| Resource and action | Admin | Teacher | Student |
| --- | --- | --- | --- |
| Class: create | Yes | Yes (becomes teacher) | No |
| Class: read/list | All | All published, own drafts | Published only |
| Class: update, cancel | All | Own | No |
| Booking: create | Any student | No | For self only |
| Booking: read/list | All | Bookings for own classes | Own |
| Booking: cancel | All | Bookings for own classes | Own |
| User: read profile | All | Students booked in own classes | Self |
| User: change role, suspend | Yes (not own account) | No | No |

### Denial and status rules

| Situation | Response |
| --- | --- |
| Missing or invalid token | 401 (existing guard behavior) |
| Valid token without a local account | 403; the client must register first |
| Account `suspended` or `pending_verification` | 403 for every protected operation except registration and `/me` |
| Authenticated but role not allowed for the route | 403 |
| Resource exists but is outside the caller's access | 404, to avoid revealing it |

## Alternatives considered

- Auth0 RBAC permissions in the access token: avoids a per-request lookup, but
  roles stay in effect until the token expires, management splits between the
  tenant and the database, and ownership rules still need database reads.
- Per-class membership roles (`class_members`) instead of one global role: more
  flexible, but no requirement yet for a user being a teacher in one class and a
  student in another. It can be added later without changing the enforcement layers.
- Role checks only in controllers or guards: cannot express ownership rules, and
  leaves the operation unprotected for non-HTTP callers such as a future worker.
- Frontend-only restrictions: bypassed by any direct HTTP request.

## Consequences

- One indexed user lookup per protected request; cache only after measuring.
- Schema change: a `user_role` enum and a non-null `role` column on `users` with a
  `student` default, plus a migration. Existing rows become students; the first
  admin is assigned explicitly per environment, never by seed data in shared
  environments.
- New `authorization` module providing the role guard, `@Roles()` and an actor
  decorator. It depends on an actor lookup exported by `users`, so `identity` and
  `users` gain no circular import.
- Each business module ships policy functions with unit tests for allowed,
  denied and cross-owner cases, and HTTP tests that bypass the frontend.
- `docs/authentication.md` and `docs/architecture/README.md` are updated when this
  is implemented.

### Open questions for product review

1. Are `admin`, `teacher` and `student` the right roles, and can a user hold more
   than one?
2. Can teachers create classes themselves, or only admins?
3. May an admin book on behalf of a student?
4. What can teachers see about students: name only, or also email?
5. Is there a tenant boundary (schools or organizations) that admins are limited to?
6. How is the first admin created in each environment, and who can create more?

## Evidence

- `apps/api/src/modules/identity/jwt-auth.guard.ts`: identity-only global guard.
- `apps/api/src/modules/identity/verified-email.guard.ts`: existing route-level
  guard pattern that reads verified claims.
- `packages/db/src/schema/users.ts`: account `status`, no role column.
- `docs/authentication.md`: authorization gaps and token claim snapshot caveat.
- [NestJS guards and role-based authorization](https://docs.nestjs.com/guards)
