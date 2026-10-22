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
a valid access token and a strict body containing only `name`. The global JWT guard
runs first. The route-level `VerifiedEmailGuard`, exported by `IdentityModule`, then
reads `req.auth.payload` and requires these exact namespaced claims:

- `https://classflow.app/email`: valid email string, trimmed and at most 254 characters.
- `https://classflow.app/email_verified`: the boolean `true`, never the string `"true"`.

Missing, invalid or false email claims return 403 before any user/email database
lookup. Missing authenticated subject returns 401. The body cannot supply email,
verification, subject, status or generated fields. `/me` remains available with a
valid token even without verified email claims. New accounts use `active` status
and record `email_verified_at` as the time the API observed Auth0's verification
claim, not Auth0's original verification timestamp. This grants no application role.
Existing accounts are returned unchanged; this route does not reactivate suspended
users, update profile emails or verify historical rows.

The endpoint returns HTTP 200 with `id`, `name`, `email`, `status`, `createdAt` and
`updatedAt` for both new and existing users. Existing users are resolved by subject
without updating their profile. Concurrent creation uses the unique subject
constraint and re-reads the winning row, including after an email collision.
Email collisions with a different subject return a generic 409 without linking
accounts by email. The web app does not yet invoke this endpoint after login;
registration is explicit, not automatic for every authenticated request.

## Auth0 Action setup

1. Create a Post-Login Action using `infra/auth0/add-verified-email-claims.cjs`.
2. Set its `CLASSFLOW_API_AUDIENCE` secret to the API identifier matching the API's
   `AUTH0_AUDIENCE`. The Action adds claims only for that audience.
3. Deploy the Action and add it to the Login flow. Configure Auth0 email
   verification for the supported connections. Copy the verification status from
   `event.user.email_verified`, never user-editable metadata or a constant true.
4. Acquire a new access token for the API after setup and email verification.
   Previously issued tokens do not gain claims; reauthenticate to confirm the flow.
5. Call `POST /api/v1/users` with that token and `{ "name": "Ana" }`. Expect 200
   for verified claims and 403 for missing/unverified claims. Do not send email.

The namespace must match the guard's constants and Action exactly. It is an
identifier, not an endpoint the API fetches. If using another domain you control,
change both sides together. The Action file is a deployable template; this repo
change does not configure the Auth0 tenant or send verification emails.

Token claims are snapshots at issuance. Keep suitable token lifetimes and an
explicit policy for email changes/reverification. Never use an ID token as this
API's bearer token or accept client-supplied email verification.

Existing rows created with self-reported email still occupy the unique email
index. Review and remediate them explicitly before production; the new guard does
not automatically release their addresses or link them to another subject. Test
this conflict and recovery policy against your actual data without deleting or
merging accounts automatically.

References: [Auth0 custom claims](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)
and [Post-Login API](https://auth0.com/docs/actions/reference/post-login/post-login-api-object).

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
