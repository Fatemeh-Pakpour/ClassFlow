import { sql } from 'drizzle-orm';
import { users } from './schema/users.ts';

/** Trim email input before saving it, preserving the user's casing. */
export function trimEmail(email: string): string {
  return email.trim();
}

/** Match an email using the same expression as users_email_unique. */
export function userEmailEquals(email: string) {
  return sql`lower(${users.email}) = lower(${trimEmail(email)})`;
}
