interface PostgresErrorFields {
  code?: string;
  constraint?: string;
  column?: string;
}

/** Awaits a query that must fail and returns the PostgreSQL error fields. */
export async function postgresErrorOf(query: PromiseLike<unknown>): Promise<PostgresErrorFields> {
  try {
    await query;
  } catch (error) {
    // Drizzle wraps the driver's error as its cause.
    const cause = error instanceof Error && error.cause ? error.cause : error;
    const { code, constraint, column } = cause as PostgresErrorFields;
    return { code, constraint, column };
  }
  throw new Error('Expected the query to fail');
}
