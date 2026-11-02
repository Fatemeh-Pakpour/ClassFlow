import { z } from 'zod';

// Browsers compare the Origin header exactly, so a path or trailing slash never matches.
const origin = z
  .url({ protocol: /^https?$/, abort: true })
  .refine((value) => new URL(value).origin === value, {
    message:
      'must be an origin like https://app.example.com (no path or trailing slash)',
  });

// Password used by the .env.example files; never valid outside local development.
const PLACEHOLDER_PASSWORD = 'change-me';

/**
 * Single source of truth for the API's environment.
 * Validated once at boot: the process refuses to start on a bad config
 * instead of failing later on the first request that needs a value.
 */
export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(4000),

    // Comma-separated list of origins allowed to call the API from a browser.
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:3000')
      .transform((value) =>
        value
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
      )
      .pipe(z.array(origin)),

    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    // Per process. Keep (apps × replicas × pool max) below Postgres max_connections (100 by default).
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    DATABASE_LOG_QUERIES: z.stringbool().default(false),

    RABBITMQ_URL: z.url({ protocol: /^amqps?$/ }),

    // Auth0 tenant that issues access tokens, e.g. https://classflow.eu.auth0.com/
    AUTH0_ISSUER_BASE_URL: z.url({ protocol: /^https$/ }),
    // Identifier of the Auth0 API (Resource Server); must match the token's `aud`.
    AUTH0_AUDIENCE: z.string().trim().min(1),
  })
  .superRefine(
    (env, ctx) => {
      if (env.NODE_ENV !== 'production') return;
      const fail = (path: string, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message });

      if (
        env.CORS_ORIGINS.some((value) =>
          ['localhost', '127.0.0.1', '[::1]'].includes(new URL(value).hostname),
        )
      ) {
        fail('CORS_ORIGINS', 'must not allow localhost in production');
      }
      if (new URL(env.DATABASE_URL).password === PLACEHOLDER_PASSWORD) {
        fail(
          'DATABASE_URL',
          'still uses the .env.example placeholder password',
        );
      }
      if (new URL(env.RABBITMQ_URL).password === PLACEHOLDER_PASSWORD) {
        fail(
          'RABBITMQ_URL',
          'still uses the .env.example placeholder password',
        );
      }
      if (env.DATABASE_LOG_QUERIES) {
        fail(
          'DATABASE_LOG_QUERIES',
          'must be false in production (logged queries can contain personal data)',
        );
      }
    },
    // Field errors are reported first; these rules assume the fields are well-formed.
    { when: (payload) => payload.issues.length === 0 },
  );

export type Env = z.infer<typeof envSchema>;
