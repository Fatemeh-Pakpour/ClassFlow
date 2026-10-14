import { createDb } from "./client.ts";
import { users } from "./schema/users.ts";

process.loadEnvFile('.env');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error("DATABASE_URL is not set")

const { db, pool } = createDb({ connectionString })
try {
    const inserted = await db.insert(users).values([
        { email: 'ana@example.com', name: 'Ana' },
        { email: 'john@example.com', name: 'John' },
        { email: 'sara@example.com', name: 'Sara' },
    ]).onConflictDoNothing().returning();

    console.log(inserted)
} finally {
    await pool.end();

}
