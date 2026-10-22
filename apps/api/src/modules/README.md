# Business modules

Each module owns a business capability, its controllers, services and persistence
queries. Start with a flat module folder; introduce subfolders only when needed.

`identity` owns bearer authentication and `/me`. `users` owns local account lookup
and registration through `POST /api/v1/users`. It imports IdentityModule for the exported verified-email guard. Registration
requires verified token email claims and accepts only a display name from the body; avoid two owners for the same account lifecycle.

Add `classes`, `bookings`, `payments` and `notifications` with their first actual
use case. Register a module in AppModule when it provides working behavior.

Cross-module access goes through explicitly exported providers imported through
the owning Nest module. Do not import another module's private repository or write
its tables directly. Avoid circular dependencies and routine use of `forwardRef`.
The global auth guard is a deliberate cross-cutting exception.

Repositories report persistence outcomes without importing application errors.
For example, `EmailAlreadyExistsError` describes database uniqueness; UsersService
decides whether to recover the caller's concurrent registration or raise
`UserEmailConflictError`. The controller maps that application error to HTTP 409.

The database package centralizes schema and migrations, but each business module
owns how its tables are used. Shared database access does not grant permission to
bypass another module's invariants. These boundaries currently require code review;
folder names alone do not enforce them.
