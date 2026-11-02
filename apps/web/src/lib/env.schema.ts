import { z } from "zod";

const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

/**
 * Server environment of the web app. The Auth0 SDK reads these variables itself,
 * but only warns (or fails on the first request) when one is missing or wrong, so
 * src/instrumentation.ts validates them once when the server starts.
 */
export const webEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // Encrypts the session cookie: openssl rand -hex 32
    AUTH0_SECRET: z.string().min(32, "must be at least 32 characters (openssl rand -hex 32)"),
    // The SDK accepts a comma-separated list when the app is served from several URLs.
    APP_BASE_URL: z
      .string()
      .transform((value) =>
        value
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.url({ protocol: /^https?$/ })).min(1)),

    AUTH0_DOMAIN: z
      .string()
      .regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i, "must be the tenant host only, e.g. classflow.eu.auth0.com (no https://)"),
    AUTH0_CLIENT_ID: z.string().trim().min(1),
    AUTH0_CLIENT_SECRET: z.string().trim().min(1),
    // Without it Auth0 issues tokens the API rejects; must match AUTH0_AUDIENCE in apps/api.
    AUTH0_AUDIENCE: z.string().trim().min(1),
  })
  .superRefine(
    (env, ctx) => {
      // `next start` always runs as production, so loopback hosts stay allowed for
      // local smoke tests of a production build; browsers treat them as secure.
      if (env.NODE_ENV !== "production") return;
      env.APP_BASE_URL.forEach((url, index) => {
        const { protocol, hostname } = new URL(url);
        if (protocol !== "https:" && !LOOPBACK_HOSTS.includes(hostname)) {
          ctx.addIssue({
            code: "custom",
            path: ["APP_BASE_URL", index],
            message: "must use https in production (session cookies are secure-only)",
          });
        }
      });
    },
    // Field errors are reported first; this rule assumes APP_BASE_URL is well-formed.
    { when: (payload) => payload.issues.length === 0 },
  );

export type WebEnv = z.infer<typeof webEnvSchema>;

/** Parses the environment, throwing one error that lists every invalid variable. */
export function parseWebEnv(source: Record<string, string | undefined>): WebEnv {
  const result = webEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid web environment (see apps/web/.env.example):\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
