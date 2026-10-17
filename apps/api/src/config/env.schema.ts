import { z } from 'zod';

/**
 * Single source of truth for the API's environment.
 * Validated once at boot: the process refuses to start on a bad config
 * instead of failing later on the first request that needs a value.
 */
export const envSchema = z.object({
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
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Per process. Keep (apps × replicas × pool max) below Postgres max_connections (100 by default).
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DATABASE_LOG_QUERIES: z.stringbool().default(false),

  RABBITMQ_URL: z.url({ protocol: /^amqps?$/ }),

  // Auth0 tenant that issues access tokens, e.g. https://classflow.eu.auth0.com/
  AUTH0_ISSUER_BASE_URL: z.url({ protocol: /^https$/ }),
  // Identifier of the Auth0 API (Resource Server); must match the token's `aud`.
  AUTH0_AUDIENCE: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;
