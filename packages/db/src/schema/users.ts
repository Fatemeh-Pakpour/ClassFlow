import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { id, timestamps } from './_columns.ts';

export const userStatusEnum = pgEnum('user_status', [
  'pending_verification',
  'active',
  'suspended',
  'pending_deletion',
]);

export const users = pgTable(
  'users',
  {
    id: id(),
    email: text().notNull(),
    name: text().notNull(),
    status: userStatusEnum()
      .notNull()
      .default('pending_verification'),
    deleted_at: timestamp({ withTimezone: true }).defaultNow(),
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

