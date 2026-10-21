import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { id, timestamps } from './_columns.ts';

export const userStatusEnum = pgEnum('user_status', [
  'pending_verification',
  'active',
  'suspended'
]);

export const users = pgTable(
  'users',
  {
    id: id(),
    auth0Subject: text('auth0_subject').unique(),
    email: varchar({ length: 254 }).notNull(),
    name: varchar({ length: 100 }).notNull(),
    status: userStatusEnum()
      .notNull(),
    email_verified_at: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    // Case-insensitive uniqueness: "Ana@x.com" and "ana@x.com" are one account.
    uniqueIndex('users_email_unique').on(sql`lower(${table.email})`),
  ],
);

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type UserStatus = typeof userStatusEnum.enumValues[number];

