# Web instructions

Follow the root `AGENTS.md`. Shared documentation paths are relative to the repo root.

- Use the App Router and existing component conventions. Keep components on the
  server unless browser state, events or APIs require a client component.
- Keep business UI and feature hooks in `src/features/<feature>`, generic shared
  UI in `src/components`, and routing in `src/app`. Read `src/features/README.md`.
- Keep Auth0 secrets and access tokens on the server. Read
  `docs/authentication.md` before changing sessions, proxy or protected UI.
- The Auth0 proxy manages auth routes and session middleware; it does not by itself
  protect every page. Check sessions explicitly for protected server-rendered UI.
- Do not import `@classflow/db` into the frontend. Put business rules and protected
  data operations in the API; use server-side token handling when adding API calls.
- Match the existing Tailwind and component styling patterns. Use semantic HTML,
  accessible labels and keyboard behavior; handle loading, empty and error states.
- Run web lint and typecheck; build for routing, rendering or configuration changes.
  There is currently no automated frontend test script. Report manual checks and
  gaps accurately rather than claiming root `pnpm test` tests the UI.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
