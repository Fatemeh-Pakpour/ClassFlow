import { createDb } from "./client.ts";
import { users } from "./schema/users.ts";
import { trimEmail } from './email.ts';

process.loadEnvFile('.env');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error("DATABASE_URL is not set")

const { db, pool } = createDb({ connectionString })
try {
    const inserted = await db.insert(users).values([
        { email: 'ana@example.com', name: 'Ana', status: 'active' as const },
        { email: 'john@example.com', name: 'John', status: 'active' as const },
        { email: 'sara@example.com', name: 'Sara', status: 'active' as const },
    ].map((user) => ({
        ...user,
        email: trimEmail(user.email),
    }))).onConflictDoNothing().returning();

    console.log(inserted)
} finally {
    await pool.end();

}
