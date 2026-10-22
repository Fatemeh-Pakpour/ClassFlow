import { sql } from 'drizzle-orm';
import { users } from './schema/users.ts';

export function trimEmail(email: string): string {
  return email.trim();
}

export function userEmailEquals(email: string) {
  return sql`lower(${users.email}) = lower(${trimEmail(email)})`;
}
