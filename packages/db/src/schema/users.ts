import { sql } from 'drizzle-orm';
import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { id, timestamps } from './_columns.ts';

export const users = pgTable(
  'users',
  {
    id: id(),
    email: text().notNull(),
    name: text().notNull(),
    ...timestamps,
  },
  (table) => [
    // Case-insensitive uniqueness: "Ana@x.com" and "ana@x.com" are one account.
    uniqueIndex('users_email_unique').on(sql`lower(${table.email})`),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
