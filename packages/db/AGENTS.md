# Database package instructions

Follow the root `AGENTS.md`. Read `docs/database-migrations.md` before changing
schemas, constraints, seed data or migrations.

- Keep schema exports in `src/schema/index.ts`. Reuse shared column builders where
  appropriate. Preserve agreement between client and Drizzle Kit snake_case casing.
- Consider existing data, nullability, uniqueness and foreign-key behavior when
  changing tables. Do not infer business lifecycle rules from a proposed feature.
- Generate and review SQL and metadata together. Do not rewrite migrations already
  applied to shared environments or use `db:push` as the migration workflow.
- Preserve the existing `.ts` source import convention in this package and public
  package exports; build consumers against the package rather than internal paths.
- Close pools in standalone scripts and avoid migrations during application startup.
- Run typecheck, build and migration checks as appropriate. Static migration checks
  do not establish that SQL works on a real PostgreSQL database.
