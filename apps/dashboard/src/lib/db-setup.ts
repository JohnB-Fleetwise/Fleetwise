let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

export async function ensureDbInitialized(): Promise<void> {
  if (dbInitialized) return;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    const { initializeDatabase } = await import("./db-init");
    await initializeDatabase();
    dbInitialized = true;
    dbInitPromise = null;
  })();

  return dbInitPromise;
}
