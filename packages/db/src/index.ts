export * from './client.ts';
export * as schema from './schema/index.ts';
export * from './schema/index.ts';

// Re-exported so apps use the exact drizzle-orm instance this package was
// built against (operators like eq/and/sql, and its types), instead of
// depending on drizzle-orm separately and risking two copies.
export * from 'drizzle-orm';
