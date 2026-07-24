import { isSeeded, getUserByEmail, createUser, createVehicle, createDriver, createDelivery } from "./db";
import { MOCK_VEHICLES, MOCK_DRIVERS, MOCK_DELIVERIES, DRIVER_NAMES } from "./mock-data";
import bcrypt from "bcryptjs";

let initialized = false;

export async function initializeDatabase(): Promise<void> {
  if (initialized) return;

  // Force load the state
  await import("./db").then((m) => m.ensureSchema());

  // Check if already seeded
  if (isSeeded()) {
    initialized = true;
    return;
  }

  // Seed demo user
  const existingUser = await getUserByEmail("admin@fleetwise.app");
  if (!existingUser) {
    const passwordHash = await bcrypt.hash("fleetwise123", 10);
    await createUser({
      id: "user-admin-001",
      email: "admin@fleetwise.app",
      passwordHash,
      displayName: "Alex Morgan",
    });
  }

  // Seed vehicles
  for (const v of MOCK_VEHICLES) {
    await createVehicle(v);
  }

  // Seed drivers (enriched with name/email)
  for (const d of MOCK_DRIVERS) {
    const info = DRIVER_NAMES[d.id] ?? { name: "Unknown", email: "unknown@fleetwise.com" };
    await createDriver({
      ...d,
      name: info.name,
      email: info.email,
    });
  }

  // Seed deliveries
  for (const d of MOCK_DELIVERIES) {
    await createDelivery(d);
  }

  initialized = true;
  console.log("[DB] Database seeded with demo data");
}
