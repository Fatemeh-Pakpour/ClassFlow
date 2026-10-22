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
`POST /api/v1/users` resolves or creates the current local account. It requires
a valid access token and a strict body containing only `name` and `email`. The global
schema pipe validates and trims those fields. The subject comes from the verified
token, not the body. New accounts start as `pending_verification`; email is
self-reported and `email_verified_at` stays NULL. This endpoint does not prove email
ownership or grant roles. Trusted Auth0 profile retrieval and email verification
remain future work.

The endpoint returns HTTP 200 with `id`, `name`, `email`, `status`, `createdAt` and
`updatedAt` for both new and existing users. Existing users are resolved by subject
without updating their profile. Concurrent creation uses the unique subject
constraint and re-reads the winning row. Email collisions return 409 without linking
accounts by email. The web app does not yet invoke this endpoint after login;
registration is explicit, not automatic for every authenticated request.

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
