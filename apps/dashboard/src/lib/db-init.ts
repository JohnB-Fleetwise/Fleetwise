// db-init.ts is deprecated — database seeding is now done via db-seed.ts
// This file remains as a re-export for backwards compatibility with instrumentation.ts
export { seedDatabase as initializeDatabase } from "./db-seed";
