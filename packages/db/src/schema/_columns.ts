import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Shared column builders so every table follows the same conventions.
 * Property names are camelCase; the client and drizzle-kit both use
 * `casing: 'snake_case'`, so they become snake_case columns in Postgres.
 */

// UUIDv7 is time-ordered: index-friendly like a serial, but safe to expose in
// URLs and to generate outside the database. Native in PostgreSQL 18+.
export const id = () =>
  uuid()
    .primaryKey()
    .default(sql`uuidv7()`);

export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
