export async function register() {
  const { ensureDbInitialized } = await import("./src/lib/db-setup");
  await ensureDbInitialized();
  console.log("[Instrumentation] Database initialized");
}
