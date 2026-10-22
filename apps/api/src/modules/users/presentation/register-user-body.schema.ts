import { RegisterUserSchema } from '../application/register-user.schema.js';
import type { z } from 'zod';

// Email and verification status come only from authenticated token claims.
export const RegisterUserBodySchema = RegisterUserSchema.omit({
  auth0Subject: true,
  email: true,
  emailVerified: true,
}).strict();

export type RegisterUserBody = z.infer<typeof RegisterUserBodySchema>;
