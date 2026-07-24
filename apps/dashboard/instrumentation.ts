export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureDbInitialized } = await import("./src/lib/db-setup");
    await ensureDbInitialized();
    console.log("[Instrumentation] Database initialized");
  }
}
