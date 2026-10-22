import z from 'zod';

export const RegisterUserSchema = z.strictObject({
  auth0Subject: z.string().min(1),
  email: z.string().trim().max(254).pipe(z.email()),
  name: z.string().trim().min(1).max(100),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
