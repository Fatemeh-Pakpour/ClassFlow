# API instructions

Follow the root `AGENTS.md`. Read `docs/authentication.md` for auth changes and
`docs/testing.md` for behavior changes (paths relative to the repository root).

- Follow the existing NestJS module structure and dependency injection patterns.
  Keep transport handling in controllers; introduce services for business logic
  when needed rather than expanding controllers into workflow implementations.
- Preserve the global authentication guard and validation pipe registered through
  DI in `AppModule`. Public access must be intentional via `@Public()`.
- Keep HTTP setup in `configureApp` so runtime and HTTP tests share prefix,
  versioning, security headers and CORS configuration.
- Default endpoints use `/api/v1/...`; health is deliberately `/api/health`.
- Validate new environment variables in `src/config/env.schema.ts` and update
  `.env.example`. Use typed `ConfigService` access as in existing code.
- Use `@classflow/db` exports and the injected Drizzle instance. Do not create
  a new pool per request. Preserve the existing ESM `.js` source import style.
- Keep token verification in the established library; never replace verification
  with decoding. Add resource authorization explicitly when a feature needs it.
- Run package lint, typecheck and relevant unit/HTTP tests. Build the database
  package first if its exported types or implementation changed.
