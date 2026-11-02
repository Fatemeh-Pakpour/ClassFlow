// Runs once when a Next.js server starts, before it handles requests.
export async function register() {
  // Written as a direct check so the Edge bundle drops this Node-only import.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnvOnStartup } = await import("./lib/validate-env");
    validateEnvOnStartup();
  }
}
