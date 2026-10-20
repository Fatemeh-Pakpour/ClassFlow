# Business modules

Each module owns a business capability, its controllers, services and persistence
queries. Start with a flat module folder; introduce subfolders only when needed.

`identity` currently owns bearer authentication and `/me`. The pre-existing `users`
scaffold is not wired into the application. Decide its relationship to identity
when implementing user provisioning; avoid two owners for the same lifecycle.

Add `classes`, `bookings`, `payments` and `notifications` with their first actual
use case. Register a module in AppModule when it provides working behavior.

Cross-module access goes through explicitly exported providers imported through
the owning Nest module. Do not import another module's private repository or write
its tables directly. Avoid circular dependencies and routine use of `forwardRef`.
The global auth guard is a deliberate cross-cutting exception.

The database package centralizes schema and migrations, but each business module
owns how its tables are used. Shared database access does not grant permission to
bypass another module's invariants. These boundaries currently require code review;
folder names alone do not enforce them.
