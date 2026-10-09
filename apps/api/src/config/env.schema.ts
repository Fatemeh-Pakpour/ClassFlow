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
  RABBITMQ_URL: z.url({ protocol: /^amqps?$/ }),
});

export type Env = z.infer<typeof envSchema>;
