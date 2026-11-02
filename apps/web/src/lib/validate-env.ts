import { parseWebEnv } from "./env.schema";

/** Fails server startup with every invalid variable listed, not on the first login. */
export function validateEnvOnStartup(): void {
  try {
    parseWebEnv(process.env);
  } catch (error) {
    // `next start` logs a failed instrumentation hook but keeps serving 500s; exit so
    // the deployment fails visibly. `next dev` keeps running and shows the error.
    if (process.env.NODE_ENV === "production") {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
    throw error;
  }
}
