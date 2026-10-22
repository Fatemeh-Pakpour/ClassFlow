import { RegisterUserSchema } from '../application/register-user.schema.js';
import type { z } from 'zod';

// Identity, status, IDs and timestamps are never accepted from the client.
export const RegisterUserBodySchema = RegisterUserSchema.omit({
  auth0Subject: true,
}).strict();

export type RegisterUserBody = z.infer<typeof RegisterUserBodySchema>;
