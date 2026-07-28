// ─── Database Seed Script ─────────────────────────────
// Run: npx tsx src/lib/db-seed.ts  (this file IS db-seed.ts)
// Importable: import { seedDatabase } from "./db-seed";
//
// Seeds admin user + FL-based fleet demo data into Neon PostgreSQL.
// Skips seeding if fleet-001 already has vehicles.

import bcrypt from "bcryptjs";
import { getDb, users, vehicles, drivers, deliveries } from "./db";
import { eq, sql } from "drizzle-orm";

// ─── Helpers ───────────────────────────────────────────
function uid(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

function iso(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
}

function coord(lat: number, lng: number) {
  return { latitude: lat, longitude: lng };
}

function randomNear(lat: number, lng: number, spreadKm: number) {
  const degPerKm = 0.009;
  return {
    latitude: lat + (Math.random() - 0.5) * spreadKm * degPerKm * 2,
    longitude: lng + (Math.random() - 0.5) * spreadKm * degPerKm * 2,
  };
}

// FL city centers
const MIA = { lat: 25.7617, lng: -80.1918 };
const ORL = { lat: 28.5383, lng: -81.3792 };
const TPA = { lat: 27.9506, lng: -82.4572 };
const JAX = { lat: 30.3322, lng: -81.6557 };
const FTL = { lat: 26.1224, lng: -80.1373 };
const TAL = { lat: 30.4383, lng: -84.2807 };
const WPB = { lat: 26.7153, lng: -80.0534 };
const NAP = { lat: 26.1420, lng: -81.7948 };
const STPETE = { lat: 27.7676, lng: -82.6403 };
const DAYTONA = { lat: 29.2108, lng: -81.0228 };


// ─── Seed Data (FL-based) ─────────────────────────────

const SEED_VEHICLES = [
  { id: "V-001", name: "Van Alpha", make: "Ford", model: "Transit 250", year: 2023, licensePlate: "7ABC123", vin: "1FTBR1C84PKA12345", status: "active", lat: MIA.lat, lng: MIA.lng, spread: 3, odometerKm: 15230, fuelType: "regular", fuelCapacityL: 95, assignedDriverId: "D-001", category: "van", insDays: 180, regDays: 300, createdDays: -120 },
  { id: "V-002", name: "Van Beta", make: "Mercedes", model: "Sprinter", year: 2024, licensePlate: "7XYZ456", vin: "WD3PE8CC0KJ67890", status: "active", lat: ORL.lat, lng: ORL.lng, spread: 5, odometerKm: 8450, fuelType: "diesel", fuelCapacityL: 75, assignedDriverId: "D-002", category: "van", insDays: 200, regDays: 365, createdDays: -90 },
  { id: "V-003", name: "Truck Delta", make: "Isuzu", model: "NPR-HD", year: 2022, licensePlate: "8LMN789", vin: "JALC4W168K7012345", status: "active", lat: TPA.lat, lng: TPA.lng, spread: 4, odometerKm: 28900, fuelType: "diesel", fuelCapacityL: 120, assignedDriverId: "D-003", category: "truck", insDays: 150, regDays: 250, createdDays: -200 },
  { id: "V-004", name: "Car Gamma", make: "Toyota", model: "Camry Hybrid", year: 2024, licensePlate: "6DEF345", vin: "4T1B11HK4JU123456", status: "idle", lat: JAX.lat, lng: JAX.lng, spread: 2, odometerKm: 3120, fuelType: "regular", fuelCapacityL: 50, assignedDriverId: "D-004", category: "car", insDays: 350, regDays: 400, createdDays: -60 },
  { id: "V-005", name: "Van Epsilon", make: "Ram", model: "ProMaster 2500", year: 2023, licensePlate: "9GHI012", vin: "3C6TRVDG2KE123456", status: "active", lat: FTL.lat, lng: FTL.lng, spread: 3, odometerKm: 19500, fuelType: "regular", fuelCapacityL: 90, assignedDriverId: "D-005", category: "van", insDays: 90, regDays: 180, createdDays: -100 },
  { id: "V-006", name: "Truck Zeta", make: "Hino", model: "268", year: 2024, licensePlate: "5JKL345", vin: "JHHSDM2H0MK123456", status: "active", lat: TAL.lat, lng: TAL.lng, spread: 5, odometerKm: 6700, fuelType: "diesel", fuelCapacityL: 140, assignedDriverId: "D-006", category: "truck", insDays: 270, regDays: 365, createdDays: -80 },
  { id: "V-007", name: "Van Eta", make: "Nissan", model: "NV2500", year: 2022, licensePlate: "4MNO678", vin: "1N6BF0LY0KN123456", status: "maintenance", lat: WPB.lat, lng: WPB.lng, spread: 1, odometerKm: 42100, fuelType: "regular", fuelCapacityL: 85, assignedDriverId: null, category: "van", insDays: 30, regDays: 60, createdDays: -300 },
  { id: "V-008", name: "Car Theta", make: "Honda", model: "Civic", year: 2023, licensePlate: "3PQR901", vin: "19XFC2F89KE123456", status: "idle", lat: NAP.lat, lng: NAP.lng, spread: 2, odometerKm: 8900, fuelType: "regular", fuelCapacityL: 47, assignedDriverId: "D-008", category: "car", insDays: 200, regDays: 300, createdDays: -50 },
  { id: "V-009", name: "Truck Iota", make: "Ford", model: "F-650", year: 2023, licensePlate: "2STU234", vin: "1FDNF6DC7KD123456", status: "out_of_service", lat: STPETE.lat, lng: STPETE.lng, spread: 1, odometerKm: 35000, fuelType: "diesel", fuelCapacityL: 200, assignedDriverId: null, category: "truck", insDays: 100, regDays: 200, createdDays: -150 },
  { id: "V-010", name: "Van Kappa", make: "Ford", model: "E-350", year: 2024, licensePlate: "1VWX567", vin: "1FDSE35L0RH123456", status: "active", lat: DAYTONA.lat, lng: DAYTONA.lng, spread: 3, odometerKm: 4500, fuelType: "regular", fuelCapacityL: 100, assignedDriverId: "D-007", category: "van", insDays: 300, regDays: 365, createdDays: -30 },
];

const SEED_DRIVERS = [
  { id: "D-001", userId: "user-001", name: "Sarah Chen", email: "sarah.chen@fleetwise.com", licenseNumber: "DL-FL-1234567", licenseExpiryDays: 500, assignedVehicleId: "V-001", status: "on_delivery", rating: 4.8, totalDeliveries: 1240, phone: "+1-305-555-0101", createdDays: -300 },
  { id: "D-002", userId: "user-002", name: "Marcus Johnson", email: "marcus.j@fleetwise.com", licenseNumber: "DL-FL-2345678", licenseExpiryDays: 400, assignedVehicleId: "V-002", status: "on_delivery", rating: 4.5, totalDeliveries: 890, phone: "+1-407-555-0102", createdDays: -200 },
  { id: "D-003", userId: "user-003", name: "Javier Rodriguez", email: "javier.r@fleetwise.com", licenseNumber: "DL-FL-3456789", licenseExpiryDays: 600, assignedVehicleId: "V-003", status: "available", rating: 4.9, totalDeliveries: 2100, phone: "+1-813-555-0103", createdDays: -500 },
  { id: "D-004", userId: "user-004", name: "Emily Park", email: "emily.park@fleetwise.com", licenseNumber: "DL-FL-4567890", licenseExpiryDays: 300, assignedVehicleId: "V-004", status: "available", rating: 4.2, totalDeliveries: 430, phone: "+1-904-555-0104", createdDays: -150 },
  { id: "D-005", userId: "user-005", name: "David Kim", email: "david.kim@fleetwise.com", licenseNumber: "DL-FL-5678901", licenseExpiryDays: 200, assignedVehicleId: "V-005", status: "on_delivery", rating: 4.7, totalDeliveries: 1560, phone: "+1-954-555-0105", createdDays: -250 },
  { id: "D-006", userId: "user-006", name: "Lisa Thompson", email: "lisa.t@fleetwise.com", licenseNumber: "DL-FL-6789012", licenseExpiryDays: 450, assignedVehicleId: "V-006", status: "on_delivery", rating: 3.9, totalDeliveries: 320, phone: "+1-850-555-0106", createdDays: -100 },
  { id: "D-007", userId: "user-007", name: "Robert Nguyen", email: "robert.n@fleetwise.com", licenseNumber: "DL-FL-7890123", licenseExpiryDays: 350, assignedVehicleId: "V-010", status: "available", rating: 4.6, totalDeliveries: 780, phone: "+1-386-555-0107", createdDays: -180 },
  { id: "D-008", userId: "user-008", name: "Angela Martinez", email: "angela.m@fleetwise.com", licenseNumber: "DL-FL-8901234", licenseExpiryDays: 250, assignedVehicleId: "V-008", status: "offline", rating: 4.3, totalDeliveries: 560, phone: "+1-239-555-0108", createdDays: -120 },
];

const SEED_DELIVERIES = [
  { id: "DLV-001", driverId: "D-001", vehicleId: "V-001", status: "in_transit", pLat: MIA.lat, pLng: MIA.lng, pStreet: "123 Market St", pCity: "Miami", dSpread: 2, schedPickDays: -1, schedDropDays: 0, desc: "Office supplies (3 boxes)", weight: 12.5, priority: "normal", custName: "Acme Corp", custPhone: "+1-305-555-1001", sigReq: false, payment: 0, dist: 2.3, dur: 15, createdDays: -2 },
  { id: "DLV-002", driverId: "D-002", vehicleId: "V-002", status: "picked_up", pLat: ORL.lat, pLng: ORL.lng, pStreet: "789 Sunset Blvd", pCity: "Orlando", dSpread: 8, schedPickDays: 0, schedDropDays: 0, desc: "Electronics (fragile)", weight: 8.2, priority: "high", special: "Ring doorbell twice", custName: "TechGear Inc", custPhone: "+1-407-555-1002", sigReq: true, payment: 25000, dist: 8.7, dur: 25, createdDays: -2 },
  { id: "DLV-003", driverId: "D-003", vehicleId: "V-003", status: "assigned", pLat: TPA.lat, pLng: TPA.lng, pStreet: "321 Harbor Dr", pCity: "Tampa", dSpread: 5, schedPickDays: 0, schedDropDays: 1, desc: "Restaurant supplies (pallet)", weight: 350, priority: "normal", custName: "Coastal Eats", custPhone: "+1-813-555-1003", sigReq: false, payment: 0, dist: 5.1, dur: 20, createdDays: -1 },
  { id: "DLV-004", driverId: "D-005", vehicleId: "V-005", status: "delivered", pLat: FTL.lat, pLng: FTL.lng, pStreet: "147 Broadway", pCity: "Fort Lauderdale", dSpread: 1.5, schedPickDays: -2, schedDropDays: -1, actualPickDays: -2, actualDropDays: -1, desc: "Medical supplies (refrigerated)", weight: 25, priority: "urgent", custName: "Bay Health", custPhone: "+1-954-555-1004", sigReq: true, payment: 0, dist: 1.8, dur: 10, createdDays: -3 },
  { id: "DLV-005", driverId: "D-006", vehicleId: "V-006", status: "in_transit", pLat: TAL.lat, pLng: TAL.lng, pStreet: "963 Capitol Mall", pCity: "Tallahassee", dSpread: 3, schedPickDays: -1, schedDropDays: 0, desc: "Furniture (assembly required)", weight: 80, priority: "low", special: "Use freight elevator", custName: "Capital Interiors", custPhone: "+1-850-555-1005", sigReq: false, payment: 45000, dist: 3.5, dur: 20, createdDays: -2 },
  { id: "DLV-006", driverId: "D-001", vehicleId: "V-001", status: "pending", pLat: MIA.lat, pLng: MIA.lng, pStreet: "55 2nd St", pCity: "Miami", dSpread: 2, schedPickDays: 1, schedDropDays: 1, desc: "Documents (envelope)", weight: 0.5, priority: "high", custName: "LegalEase LLP", custPhone: "+1-305-555-1006", sigReq: true, payment: 0, dist: 1.2, dur: 8, createdDays: 0 },
  { id: "DLV-007", driverId: "D-002", vehicleId: "V-002", status: "failed", pLat: ORL.lat, pLng: ORL.lng, pStreet: "333 Vine St", pCity: "Orlando", dSpread: 6, schedPickDays: -2, schedDropDays: -1, desc: "Perishable food items", weight: 15, priority: "urgent", special: "Customer not available — rescheduled", custName: "FreshDirect", custPhone: "+1-407-555-1007", sigReq: false, payment: 0, dist: 6.3, dur: 22, createdDays: -3 },
  { id: "DLV-008", driverId: "D-007", vehicleId: "V-010", status: "in_transit", pLat: DAYTONA.lat, pLng: DAYTONA.lng, pStreet: "1 Airport Blvd", pCity: "Daytona Beach", dSpread: 4, schedPickDays: 0, schedDropDays: 0, desc: "Aviation parts", weight: 45, priority: "high", custName: "SkyTech Aviation", custPhone: "+1-386-555-1008", sigReq: true, payment: 120000, dist: 4.8, dur: 18, createdDays: -1 },
];

// ─── Display helpers ───────────────────────────────────

import type { Driver, Vehicle } from "@fleetwise/shared";

export function getDriverDisplay(driver: Driver): { name: string; email: string } {
  return {
    name: driver.name || `Driver ${driver.id.slice(-4)}`,
    email: driver.email || `${driver.id}@fleetwise.app`,
  };
}

export function getVehicleDriverName(vehicle: Vehicle): string {
  return vehicle.assignedDriverId
    ? `Driver ${vehicle.assignedDriverId.slice(-4)}`
    : "Unassigned";
}

// ─── Seed function ────────────────────────────────────

let _seeded = false;

export async function seedDatabase(): Promise<void> {
  if (_seeded) return;

  const { getDb, ensureSchema } = await import("./db");
  const { users, vehicles, drivers, deliveries } = await import("./db");
  const { eq } = await import("drizzle-orm");

  // Create tables if they don't exist yet
  await ensureSchema();

  const db = getDb();

  // Check if already seeded
  const existing = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.fleet_id, "fleet-001")).limit(1);
  if (existing.length > 0) {
    _seeded = true;
    console.log("[DB] Already seeded, skipping.");
    return;
  }

  // Seed admin user
  const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, "admin@fleetwise.app")).limit(1);
  if (existingUser.length === 0) {
    const passwordHash = await bcrypt.hash("fleetwise123", 10);
    const now = new Date();
    await db.insert(users).values({
      id: "user-admin-001",
      fleet_id: "fleet-001",
      email: "admin@fleetwise.app",
      password_hash: passwordHash,
      display_name: "John B",
      role: "admin",
      created_at: now,
      updated_at: now,
    });
    console.log("[DB] Admin user created.");
  }

  // Seed vehicles
  for (const v of SEED_VEHICLES) {
    const loc = randomNear(v.lat, v.lng, v.spread);
    await db.insert(vehicles).values({
      id: v.id,
      fleet_id: "fleet-001",
      name: v.name,
      make: v.make,
      model: v.model,
      year: v.year,
      license_plate: v.licensePlate,
      vin: v.vin,
      status: v.status,
      current_location_lat: loc.latitude,
      current_location_lng: loc.longitude,
      odometer_km: v.odometerKm,
      fuel_type: v.fuelType,
      fuel_capacity_l: v.fuelCapacityL,
      assigned_driver_id: v.assignedDriverId,
      category: v.category,
      insurance_expiry: iso(v.insDays),
      registration_expiry: iso(v.regDays),
      created_at: new Date(iso(v.createdDays)),
      updated_at: new Date(),
    });
  }

  // Seed drivers
  for (const d of SEED_DRIVERS) {
    await db.insert(drivers).values({
      id: d.id,
      fleet_id: "fleet-001",
      user_id: d.userId,
      name: d.name,
      email: d.email,
      license_number: d.licenseNumber,
      license_expiry: iso(d.licenseExpiryDays),
      assigned_vehicle_id: d.assignedVehicleId,
      status: d.status,
      rating: d.rating,
      total_deliveries: d.totalDeliveries,
      phone_number: d.phone,
      created_at: new Date(iso(d.createdDays)),
      updated_at: new Date(),
    });
  }

  // Seed deliveries
  for (const dlv of SEED_DELIVERIES) {
    const pLoc = randomNear(dlv.pLat, dlv.pLng, 1);
    const dLoc = randomNear(dlv.pLat, dlv.pLng, dlv.dSpread);
    await db.insert(deliveries).values({
      id: dlv.id,
      fleet_id: "fleet-001",
      driver_id: dlv.driverId,
      vehicle_id: dlv.vehicleId,
      status: dlv.status,
      pickup_street: dlv.pStreet,
      pickup_city: dlv.pCity,
      pickup_state: "FL",
      pickup_zip: String(33000 + Math.floor(Math.random() * 1000)),
      pickup_country: "US",
      pickup_lat: pLoc.latitude,
      pickup_lng: pLoc.longitude,
      dropoff_street: "Dropoff St",
      dropoff_city: dlv.pCity,
      dropoff_state: "FL",
      dropoff_zip: String(33000 + Math.floor(Math.random() * 1000)),
      dropoff_country: "US",
      dropoff_lat: dLoc.latitude,
      dropoff_lng: dLoc.longitude,
      scheduled_pickup_time: iso(dlv.schedPickDays),
      scheduled_dropoff_time: iso(dlv.schedDropDays),
      actual_pickup_time: dlv.actualPickDays != null ? iso(dlv.actualPickDays) : null,
      actual_dropoff_time: dlv.actualDropDays != null ? iso(dlv.actualDropDays) : null,
      package_description: dlv.desc,
      package_weight_kg: dlv.weight,
      special_instructions: dlv.special ?? null,
      priority: dlv.priority,
      customer_name: dlv.custName,
      customer_phone: dlv.custPhone,
      signature_required: dlv.sigReq,
      payment_collected: dlv.payment,
      distance_km: dlv.dist,
      estimated_duration_min: dlv.dur,
      created_at: new Date(iso(dlv.createdDays)),
      updated_at: new Date(),
    });
  }

  _seeded = true;
  console.log("[DB] Seeded 10 vehicles, 8 drivers, 8 deliveries for fleet-001");
}

// Run directly: npx tsx src/lib/db-seed.ts
if (require.main === module || (typeof process !== "undefined" && process.argv[1]?.includes("db-seed"))) {
  seedDatabase()
    .then(() => { console.log("[DB] Seed complete."); process.exit(0); })
    .catch((err) => { console.error("[DB] Seed failed:", err); process.exit(1); });
}
