# Database migrations

## Sources of truth

- Schema: `packages/db/src/schema`, exported through `src/schema/index.ts`.
- Generated SQL and metadata: `packages/db/drizzle`.
- Generation configuration: `packages/db/drizzle.config.ts`.
- Connection construction: `packages/db/src/client.ts`.
- Deployment runner: `packages/db/src/migrate.ts`.

Client and generator both use snake_case casing. Shared column builders provide
UUIDv7 identifiers and timestamps; UUIDv7 defaults require compatible PostgreSQL
(local Compose declares PostgreSQL 18). Users have a case-insensitive unique email
index and a status enum. Review actual constraints before changing write behavior.

## Local workflow

1. Configure `packages/db/.env` from its example for an explicitly identified local
   disposable database. Verify connectivity; see the Compose caveat in
   [architecture](architecture/README.md).
2. Edit schema definitions and exports. Consider existing rows and deployed clients.
3. Run `pnpm db:generate` from the repository root.
4. Review generated SQL and metadata for unintended drops, renames, locking,
   nullability changes and data loss. Resolve ambiguity before applying SQL.
5. Run `pnpm db:check`, DB typecheck and DB build. Drizzle configuration requires
   `DATABASE_URL` even for commands that do not apply migrations.
6. Apply with `pnpm db:migrate` only against the identified local/test target.
   Verify both fresh installation and upgrades with representative existing data
   when the change can affect it. Check constraints and affected application paths.
7. Commit schema, SQL and generated metadata together. Update affected docs/tests.

`db:push` exists in the package but bypasses the reviewed migration workflow. Do not
use it for shared environments. Do not edit already-applied shared migrations;
create a new forward migration instead. Seed scripts insert data and require an
explicit target; they are not a routine verification command.

## Deployment expectations

The package provides `pnpm --filter @classflow/db migrate:prod` after building it.
Its runner reads `DATABASE_URL`, uses one connection, applies SQL from the package's
`drizzle` directory and closes the pool. Deployment artifacts must include both
built code and that migration directory.

The runner is intended as one deployment step before application rollout, not on
each replica's startup. No automated deployment pipeline is currently configured
in this repository. Do not imply that migration ordering is already automated.

For breaking schema changes, plan compatibility across old/new application versions,
backfills, rollout and recovery. Prefer additive changes followed by separately
reviewed cleanup. Document backup/recovery requirements for the actual target;
there is no generic automatic rollback command established here.
