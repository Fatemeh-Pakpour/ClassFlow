# Frontend features

Put business-specific UI, hooks and API orchestration under `features/<feature>`.
The existing authentication status UI belongs to `identity`. Keep routes and layouts
in `app`, generic UI in `components`, and server integration helpers in `lib`.

Colocate feature hooks with their feature. Add a top-level `hooks` folder only for
hooks actually reused across features. Keep server-only Auth0/token code out of
client entry points. Avoid a barrel that mixes server and client exports.
