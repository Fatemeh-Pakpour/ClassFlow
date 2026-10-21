# Authentication and authorization

## Implemented web flow

`apps/web/src/lib/auth0.ts` constructs the server-side `Auth0Client` and requests
the configured API audience with `openid profile email offline_access` scopes.
`apps/web/src/proxy.ts` delegates matching requests to Auth0 middleware for auth
routes and rolling sessions. `AuthStatus` reads the session in a server component.

The access-token endpoint is explicitly disabled (`enableAccessTokenEndpoint:
false`). Keep access tokens server-side when adding web-to-API requests. A complete
authenticated API caller is not currently implemented in the web source.

Proxy execution does not establish page authorization. Protected pages and server
operations must check the session and handle unauthenticated access deliberately.

## Implemented API flow

API identity source lives in `apps/api/src/modules/identity`; web identity UI lives
in `apps/web/src/features/identity/components`. The server Auth0 client remains
in `apps/web/src/lib/auth0.ts`.

`IdentityModule` registers `JwtAuthGuard` globally through `APP_GUARD`. Routes require
a bearer access token unless `@Public()` metadata opts them out. Handler metadata
takes precedence over controller metadata.

`express-oauth2-jwt-bearer` verifies tokens using the configured issuer and audience.
Verified claims are available on `req.auth.payload`. `/api/v1/me` returns the subject
and permissions claim (or an empty permissions array). `/api/health` is public.

The guard preserves library authentication error statuses and challenge headers.
Invalid-token responses are sanitized; unexpected failures propagate to NestJS.
Preserve this behavior and its tests when editing the guard.

## Authorization boundary and current gaps

A valid token establishes identity, not permission to every resource. No application
role model, resource ownership checks or permission enforcement is currently
implemented. Returning `permissions` from `/me` does not enforce them.

The users schema includes a nullable, unique `auth0Subject` column, introduced by
migration 0004. Existing and seed users can remain unmapped with NULL subjects.
Identity resolution and first-login provisioning are not implemented yet. New
Auth0-backed users must use the verified token subject; email alone must not link
accounts. The initial policy is to create a local user on the first authenticated
API interaction after login, once trusted profile data is available.

For new protected operations, specify the resource, allowed actor and access rule;
enforce that rule in the API and test allowed and denied cases. Never rely solely
on hidden UI controls or client-submitted ownership identifiers.

## Configuration and verification

Web variable names are documented in `apps/web/.env.example`. API issuer/audience
validation lives in `apps/api/src/infrastructure/config/env.schema.ts` and its `.env.example`.
Keep issuer/audience configuration consistent across the apps and Auth0.

Never commit secrets or expose tokens in browser storage, logs or error responses.
For auth changes, run guard unit tests and API HTTP tests; explicitly verify the
affected login/session flow when a configured Auth0 environment is available.
Mocked tests do not establish a working live Auth0 integration.
