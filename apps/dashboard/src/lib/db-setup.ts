let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

export async function ensureDbInitialized(): Promise<void> {
  if (dbInitialized) return;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    // Only seed if DATABASE_URL is configured (skip in local dev without Neon)
    if (!process.env.DATABASE_URL) {
      console.log("[DB] No DATABASE_URL — skipping seed in local dev");
    } else {
      const { seedDatabase } = await import("./mock-data");
      await seedDatabase();
    }
    dbInitialized = true;
    dbInitPromise = null;
  })();

  return dbInitPromise;
}
