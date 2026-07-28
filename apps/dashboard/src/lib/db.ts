// ─── PostgreSQL Database Layer (Neon serverless + Drizzle ORM) ──────
// Replaces the old JSON file store. All CRUD functions maintain the same
// signatures so API routes and auth work without changes.

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  pgTable,
  text,
  timestamp,
  real,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { eq, and, sql, desc } from "drizzle-orm";

// ─── Drizzle Schema (inline — same as schema.ts) ─────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  fleet_id: text("fleet_id").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  display_name: text("display_name").notNull(),
  role: text("role").notNull().default("admin"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: text("id").primaryKey(),
  fleet_id: text("fleet_id").notNull(),
  name: text("name").notNull(),
  make: text("make").notNull().default(""),
  model: text("model").notNull().default(""),
  year: integer("year").notNull(),
  license_plate: text("license_plate").notNull(),
  vin: text("vin").notNull().default(""),
  status: text("status").notNull().default("idle"),
  current_location_lat: real("current_location_lat"),
  current_location_lng: real("current_location_lng"),
  odometer_km: real("odometer_km").notNull().default(0),
  fuel_type: text("fuel_type").notNull().default("regular"),
  fuel_capacity_l: real("fuel_capacity_l").notNull().default(80),
  assigned_driver_id: text("assigned_driver_id"),
  category: text("category").notNull().default("van"),
  insurance_expiry: text("insurance_expiry").notNull(),
  registration_expiry: text("registration_expiry").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: text("id").primaryKey(),
  fleet_id: text("fleet_id").notNull(),
  user_id: text("user_id").notNull(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  license_number: text("license_number").notNull(),
  license_expiry: text("license_expiry").notNull(),
  assigned_vehicle_id: text("assigned_vehicle_id"),
  status: text("status").notNull().default("available"),
  rating: real("rating").notNull().default(0),
  total_deliveries: integer("total_deliveries").notNull().default(0),
  phone_number: text("phone_number").notNull().default(""),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const deliveries = pgTable("deliveries", {
  id: text("id").primaryKey(),
  fleet_id: text("fleet_id").notNull(),
  driver_id: text("driver_id").notNull(),
  vehicle_id: text("vehicle_id").notNull(),
  status: text("status").notNull().default("pending"),
  pickup_street: text("pickup_street").notNull().default(""),
  pickup_city: text("pickup_city").notNull().default(""),
  pickup_state: text("pickup_state").notNull().default("FL"),
  pickup_zip: text("pickup_zip").notNull().default(""),
  pickup_country: text("pickup_country").notNull().default("US"),
  pickup_lat: real("pickup_lat"),
  pickup_lng: real("pickup_lng"),
  dropoff_street: text("dropoff_street").notNull().default(""),
  dropoff_city: text("dropoff_city").notNull().default(""),
  dropoff_state: text("dropoff_state").notNull().default("FL"),
  dropoff_zip: text("dropoff_zip").notNull().default(""),
  dropoff_country: text("dropoff_country").notNull().default("US"),
  dropoff_lat: real("dropoff_lat"),
  dropoff_lng: real("dropoff_lng"),
  scheduled_pickup_time: text("scheduled_pickup_time").notNull(),
  scheduled_dropoff_time: text("scheduled_dropoff_time").notNull(),
  actual_pickup_time: text("actual_pickup_time"),
  actual_dropoff_time: text("actual_dropoff_time"),
  package_description: text("package_description").notNull().default("Package"),
  package_weight_kg: real("package_weight_kg"),
  special_instructions: text("special_instructions"),
  priority: text("priority").notNull().default("normal"),
  customer_name: text("customer_name").notNull().default(""),
  customer_phone: text("customer_phone").notNull().default(""),
  signature_required: boolean("signature_required").notNull().default(false),
  payment_collected: integer("payment_collected").notNull().default(0),
  distance_km: real("distance_km"),
  estimated_duration_min: integer("estimated_duration_min"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ─── DB Connection ────────────────────────────────────────

let _db: ReturnType<typeof drizzle> | null = null;
let _sql: ReturnType<typeof neon> | null = null;

function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    _sql = neon(url);
  }
  return _sql;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getSql());
  }
  return _db;
}

export function getDbSafe() {
  if (!process.env.DATABASE_URL) return null;
  return getDb();
}

// Auto-create tables if they don't exist (for first-time setup)
export async function ensureSchema(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" text PRIMARY KEY NOT NULL,
      "fleet_id" text NOT NULL,
      "email" text NOT NULL UNIQUE,
      "password_hash" text NOT NULL,
      "display_name" text NOT NULL,
      "role" text NOT NULL DEFAULT 'admin',
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "vehicles" (
      "id" text PRIMARY KEY NOT NULL,
      "fleet_id" text NOT NULL,
      "name" text NOT NULL,
      "make" text NOT NULL DEFAULT '',
      "model" text NOT NULL DEFAULT '',
      "year" integer NOT NULL,
      "license_plate" text NOT NULL,
      "vin" text NOT NULL DEFAULT '',
      "status" text NOT NULL DEFAULT 'idle',
      "current_location_lat" real,
      "current_location_lng" real,
      "odometer_km" real NOT NULL DEFAULT 0,
      "fuel_type" text NOT NULL DEFAULT 'regular',
      "fuel_capacity_l" real NOT NULL DEFAULT 80,
      "assigned_driver_id" text,
      "category" text NOT NULL DEFAULT 'van',
      "insurance_expiry" text NOT NULL,
      "registration_expiry" text NOT NULL,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "drivers" (
      "id" text PRIMARY KEY NOT NULL,
      "fleet_id" text NOT NULL,
      "user_id" text NOT NULL,
      "name" text NOT NULL DEFAULT '',
      "email" text NOT NULL DEFAULT '',
      "license_number" text NOT NULL,
      "license_expiry" text NOT NULL,
      "assigned_vehicle_id" text,
      "status" text NOT NULL DEFAULT 'available',
      "rating" real NOT NULL DEFAULT 0,
      "total_deliveries" integer NOT NULL DEFAULT 0,
      "phone_number" text NOT NULL DEFAULT '',
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "deliveries" (
      "id" text PRIMARY KEY NOT NULL,
      "fleet_id" text NOT NULL,
      "driver_id" text NOT NULL,
      "vehicle_id" text NOT NULL,
      "status" text NOT NULL DEFAULT 'pending',
      "pickup_street" text NOT NULL DEFAULT '',
      "pickup_city" text NOT NULL DEFAULT '',
      "pickup_state" text NOT NULL DEFAULT 'FL',
      "pickup_zip" text NOT NULL DEFAULT '',
      "pickup_country" text NOT NULL DEFAULT 'US',
      "pickup_lat" real,
      "pickup_lng" real,
      "dropoff_street" text NOT NULL DEFAULT '',
      "dropoff_city" text NOT NULL DEFAULT '',
      "dropoff_state" text NOT NULL DEFAULT 'FL',
      "dropoff_zip" text NOT NULL DEFAULT '',
      "dropoff_country" text NOT NULL DEFAULT 'US',
      "dropoff_lat" real,
      "dropoff_lng" real,
      "scheduled_pickup_time" text NOT NULL,
      "scheduled_dropoff_time" text NOT NULL,
      "actual_pickup_time" text,
      "actual_dropoff_time" text,
      "package_description" text NOT NULL DEFAULT 'Package',
      "package_weight_kg" real,
      "special_instructions" text,
      "priority" text NOT NULL DEFAULT 'normal',
      "customer_name" text NOT NULL DEFAULT '',
      "customer_phone" text NOT NULL DEFAULT '',
      "signature_required" boolean NOT NULL DEFAULT false,
      "payment_collected" integer NOT NULL DEFAULT 0,
      "distance_km" real,
      "estimated_duration_min" integer,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    );
  `;
}

export function isSeeded(): boolean {
  // Checked by seed script via actual query
  return false; // default — actual check in seedDatabase
}

// ─── Row Mappers ──────────────────────────────────────────

function mapVehicle(row: any) {
  return {
    id: row.id,
    fleetId: row.fleet_id,
    name: row.name,
    make: row.make,
    model: row.model,
    year: row.year,
    licensePlate: row.license_plate,
    vin: row.vin,
    status: row.status,
    currentLocation: row.current_location_lat != null ? {
      latitude: row.current_location_lat,
      longitude: row.current_location_lng,
    } : undefined,
    odometerKm: Math.round(row.odometer_km * 0.621371),
    fuelType: row.fuel_type,
    fuelCapacityL: row.fuel_capacity_l,
    assignedDriverId: row.assigned_driver_id ?? undefined,
    category: row.category,
    insuranceExpiry: row.insurance_expiry,
    registrationExpiry: row.registration_expiry,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

function mapDriver(row: any) {
  return {
    id: row.id,
    fleetId: row.fleet_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    licenseNumber: row.license_number,
    licenseExpiry: row.license_expiry,
    assignedVehicleId: row.assigned_vehicle_id ?? undefined,
    status: row.status,
    rating: row.rating,
    totalDeliveries: row.total_deliveries,
    phoneNumber: row.phone_number,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

function mapDelivery(row: any) {
  return {
    id: row.id,
    fleetId: row.fleet_id,
    driverId: row.driver_id,
    vehicleId: row.vehicle_id,
    status: row.status,
    pickupAddress: {
      street: row.pickup_street,
      city: row.pickup_city,
      state: row.pickup_state,
      zipCode: row.pickup_zip,
      country: row.pickup_country,
      coordinates: row.pickup_lat != null ? { latitude: row.pickup_lat, longitude: row.pickup_lng } : undefined,
    },
    dropoffAddress: {
      street: row.dropoff_street,
      city: row.dropoff_city,
      state: row.dropoff_state,
      zipCode: row.dropoff_zip,
      country: row.dropoff_country,
      coordinates: row.dropoff_lat != null ? { latitude: row.dropoff_lat, longitude: row.dropoff_lng } : undefined,
    },
    scheduledPickupTime: row.scheduled_pickup_time,
    scheduledDropoffTime: row.scheduled_dropoff_time,
    actualPickupTime: row.actual_pickup_time ?? undefined,
    actualDropoffTime: row.actual_dropoff_time ?? undefined,
    packageDescription: row.package_description,
    packageWeightKg: row.package_weight_kg ?? undefined,
    specialInstructions: row.special_instructions ?? undefined,
    priority: row.priority,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    signatureRequired: row.signature_required,
    paymentCollected: row.payment_collected,
    distanceKm: row.distance_km ?? undefined,
    estimatedDurationMin: row.estimated_duration_min ?? undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

// ─── Users ────────────────────────────────────────────────

export async function getUserByEmail(email: string) {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (rows.length === 0) return null;
  const u = rows[0]!;
  return {
    id: u.id,
    fleet_id: u.fleet_id,
    email: u.email,
    password_hash: u.password_hash,
    display_name: u.display_name,
    role: u.role,
    created_at: u.created_at instanceof Date ? u.created_at.toISOString() : String(u.created_at),
    updated_at: u.updated_at instanceof Date ? u.updated_at.toISOString() : String(u.updated_at),
  };
}

export async function getUserById(id: string) {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (rows.length === 0) return null;
  const u = rows[0]!;
  return {
    id: u.id,
    fleet_id: u.fleet_id,
    email: u.email,
    password_hash: u.password_hash,
    display_name: u.display_name,
    role: u.role,
    created_at: u.created_at instanceof Date ? u.created_at.toISOString() : String(u.created_at),
    updated_at: u.updated_at instanceof Date ? u.updated_at.toISOString() : String(u.updated_at),
  };
}

export async function createUser(user: {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  fleetId?: string;
}): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db.insert(users).values({
    id: user.id,
    fleet_id: user.fleetId ?? "fleet-" + Math.random().toString(36).slice(2, 8),
    email: user.email,
    password_hash: user.passwordHash,
    display_name: user.displayName,
    role: "admin",
    created_at: now,
    updated_at: now,
  });
}

// ─── Vehicles ─────────────────────────────────────────────

export async function getVehicles(fleetId?: string) {
  const db = getDb();
  const query = db.select().from(vehicles).orderBy(desc(vehicles.created_at));
  const rows = fleetId
    ? await query.where(eq(vehicles.fleet_id, fleetId))
    : await query;
  return rows.map(mapVehicle);
}

export async function getVehicleById(id: string, fleetId?: string) {
  const db = getDb();
  const conditions = [eq(vehicles.id, id)];
  if (fleetId) conditions.push(eq(vehicles.fleet_id, fleetId));
  const rows = await db.select().from(vehicles).where(and(...conditions)).limit(1);
  if (rows.length === 0) return null;
  return mapVehicle(rows[0]);
}

export async function createVehicle(v: any): Promise<void> {
  const db = getDb();
  const now = new Date();
  const loc = v.currentLocation;
  await db.insert(vehicles).values({
    id: v.id,
    fleet_id: v.fleetId,
    name: v.name,
    make: v.make || "",
    model: v.model || "",
    year: v.year ?? new Date().getFullYear(),
    license_plate: v.licensePlate,
    vin: v.vin || "",
    status: v.status || "idle",
    current_location_lat: loc?.latitude ?? null,
    current_location_lng: loc?.longitude ?? null,
    odometer_km: Math.round((v.odometerKm || 0) / 0.621371),
    fuel_type: v.fuelType || "regular",
    fuel_capacity_l: v.fuelCapacityL || 80,
    assigned_driver_id: v.assignedDriverId ?? null,
    category: v.category || "van",
    insurance_expiry: v.insuranceExpiry || new Date(Date.now() + 365 * 86400000).toISOString(),
    registration_expiry: v.registrationExpiry || new Date(Date.now() + 365 * 86400000).toISOString(),
    created_at: v.createdAt ? new Date(v.createdAt) : now,
    updated_at: now,
  });
}

export async function updateVehicle(id: string, data: any): Promise<void> {
  const db = getDb();
  const updates: any = { updated_at: new Date() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.make !== undefined) updates.make = data.make;
  if (data.model !== undefined) updates.model = data.model;
  if (data.year !== undefined) updates.year = data.year;
  if (data.licensePlate !== undefined) updates.license_plate = data.licensePlate;
  if (data.vin !== undefined) updates.vin = data.vin;
  if (data.status !== undefined) updates.status = data.status;
  if (data.odometerKm !== undefined) updates.odometer_km = Math.round(data.odometerKm / 0.621371);
  if (data.fuelType !== undefined) updates.fuel_type = data.fuelType;
  if (data.fuelCapacityL !== undefined) updates.fuel_capacity_l = data.fuelCapacityL;
  if (data.assignedDriverId !== undefined) updates.assigned_driver_id = data.assignedDriverId;
  if (data.category !== undefined) updates.category = data.category;
  if (data.insuranceExpiry !== undefined) updates.insurance_expiry = data.insuranceExpiry;
  if (data.registrationExpiry !== undefined) updates.registration_expiry = data.registrationExpiry;
  if (data.currentLocation) {
    updates.current_location_lat = data.currentLocation.latitude;
    updates.current_location_lng = data.currentLocation.longitude;
  }
  await db.update(vehicles).set(updates).where(eq(vehicles.id, id));
}

export async function deleteVehicle(id: string): Promise<void> {
  const db = getDb();
  await db.delete(vehicles).where(eq(vehicles.id, id));
}

// ─── Drivers ──────────────────────────────────────────────

export async function getDrivers(fleetId?: string) {
  const db = getDb();
  const query = db.select().from(drivers).orderBy(desc(drivers.created_at));
  const rows = fleetId
    ? await query.where(eq(drivers.fleet_id, fleetId))
    : await query;
  return rows.map(mapDriver);
}

export async function getDriverById(id: string, fleetId?: string) {
  const db = getDb();
  const conditions = [eq(drivers.id, id)];
  if (fleetId) conditions.push(eq(drivers.fleet_id, fleetId));
  const rows = await db.select().from(drivers).where(and(...conditions)).limit(1);
  if (rows.length === 0) return null;
  return mapDriver(rows[0]);
}

export async function createDriver(d: any): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db.insert(drivers).values({
    id: d.id,
    fleet_id: d.fleetId,
    user_id: d.userId,
    name: d.name || "",
    email: d.email || "",
    license_number: d.licenseNumber,
    license_expiry: d.licenseExpiry,
    assigned_vehicle_id: d.assignedVehicleId ?? null,
    status: d.status || "available",
    rating: d.rating || 0,
    total_deliveries: d.totalDeliveries || 0,
    phone_number: d.phoneNumber || "",
    created_at: d.createdAt ? new Date(d.createdAt) : now,
    updated_at: now,
  });
}

export async function updateDriver(id: string, data: any): Promise<void> {
  const db = getDb();
  const updates: any = { updated_at: new Date() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.email !== undefined) updates.email = data.email;
  if (data.licenseNumber !== undefined) updates.license_number = data.licenseNumber;
  if (data.licenseExpiry !== undefined) updates.license_expiry = data.licenseExpiry;
  if (data.assignedVehicleId !== undefined) updates.assigned_vehicle_id = data.assignedVehicleId;
  if (data.status !== undefined) updates.status = data.status;
  if (data.rating !== undefined) updates.rating = data.rating;
  if (data.totalDeliveries !== undefined) updates.total_deliveries = data.totalDeliveries;
  if (data.phoneNumber !== undefined) updates.phone_number = data.phoneNumber;
  await db.update(drivers).set(updates).where(eq(drivers.id, id));
}

export async function deleteDriver(id: string): Promise<void> {
  const db = getDb();
  await db.delete(drivers).where(eq(drivers.id, id));
}

// ─── Deliveries ───────────────────────────────────────────

export async function getDeliveries(fleetId?: string) {
  const db = getDb();
  const query = db.select().from(deliveries).orderBy(desc(deliveries.created_at));
  const rows = fleetId
    ? await query.where(eq(deliveries.fleet_id, fleetId))
    : await query;
  return rows.map(mapDelivery);
}

export async function getDeliveryById(id: string, fleetId?: string) {
  const db = getDb();
  const conditions = [eq(deliveries.id, id)];
  if (fleetId) conditions.push(eq(deliveries.fleet_id, fleetId));
  const rows = await db.select().from(deliveries).where(and(...conditions)).limit(1);
  if (rows.length === 0) return null;
  return mapDelivery(rows[0]);
}

export async function createDelivery(d: any): Promise<void> {
  const db = getDb();
  const now = new Date();
  const pa = d.pickupAddress || {};
  const da = d.dropoffAddress || {};
  await db.insert(deliveries).values({
    id: d.id,
    fleet_id: d.fleetId,
    driver_id: d.driverId || "",
    vehicle_id: d.vehicleId || "",
    status: d.status || "pending",
    pickup_street: pa.street || "",
    pickup_city: pa.city || "",
    pickup_state: pa.state || "FL",
    pickup_zip: pa.zipCode || "",
    pickup_country: pa.country || "US",
    pickup_lat: pa.coordinates?.latitude ?? null,
    pickup_lng: pa.coordinates?.longitude ?? null,
    dropoff_street: da.street || "",
    dropoff_city: da.city || "",
    dropoff_state: da.state || "FL",
    dropoff_zip: da.zipCode || "",
    dropoff_country: da.country || "US",
    dropoff_lat: da.coordinates?.latitude ?? null,
    dropoff_lng: da.coordinates?.longitude ?? null,
    scheduled_pickup_time: d.scheduledPickupTime || now.toISOString(),
    scheduled_dropoff_time: d.scheduledDropoffTime || new Date(Date.now() + 2 * 3600000).toISOString(),
    actual_pickup_time: d.actualPickupTime ?? null,
    actual_dropoff_time: d.actualDropoffTime ?? null,
    package_description: d.packageDescription || "Package",
    package_weight_kg: d.packageWeightKg ?? null,
    special_instructions: d.specialInstructions ?? null,
    priority: d.priority || "normal",
    customer_name: d.customerName || "",
    customer_phone: d.customerPhone || "",
    signature_required: d.signatureRequired || false,
    payment_collected: d.paymentCollected || 0,
    distance_km: d.distanceKm ?? null,
    estimated_duration_min: d.estimatedDurationMin ?? null,
    created_at: d.createdAt ? new Date(d.createdAt) : now,
    updated_at: now,
  });
}

export async function updateDelivery(id: string, data: any): Promise<void> {
  const db = getDb();
  const updates: any = { updated_at: new Date() };
  if (data.status !== undefined) updates.status = data.status;
  if (data.driverId !== undefined) updates.driver_id = data.driverId;
  if (data.vehicleId !== undefined) updates.vehicle_id = data.vehicleId;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.customerName !== undefined) updates.customer_name = data.customerName;
  if (data.customerPhone !== undefined) updates.customer_phone = data.customerPhone;
  if (data.packageDescription !== undefined) updates.package_description = data.packageDescription;
  if (data.signatureRequired !== undefined) updates.signature_required = data.signatureRequired;
  if (data.paymentCollected !== undefined) updates.payment_collected = data.paymentCollected;
  if (data.specialInstructions !== undefined) updates.special_instructions = data.specialInstructions;
  if (data.actualPickupTime !== undefined) updates.actual_pickup_time = data.actualPickupTime;
  if (data.actualDropoffTime !== undefined) updates.actual_dropoff_time = data.actualDropoffTime;
  if (data.scheduledPickupTime !== undefined) updates.scheduled_pickup_time = data.scheduledPickupTime;
  if (data.scheduledDropoffTime !== undefined) updates.scheduled_dropoff_time = data.scheduledDropoffTime;
  if (data.pickupAddress) {
    updates.pickup_street = data.pickupAddress.street;
    updates.pickup_city = data.pickupAddress.city;
    updates.pickup_state = data.pickupAddress.state;
    updates.pickup_zip = data.pickupAddress.zipCode;
    updates.pickup_country = data.pickupAddress.country;
    if (data.pickupAddress.coordinates) {
      updates.pickup_lat = data.pickupAddress.coordinates.latitude;
      updates.pickup_lng = data.pickupAddress.coordinates.longitude;
    }
  }
  if (data.dropoffAddress) {
    updates.dropoff_street = data.dropoffAddress.street;
    updates.dropoff_city = data.dropoffAddress.city;
    updates.dropoff_state = data.dropoffAddress.state;
    updates.dropoff_zip = data.dropoffAddress.zipCode;
    updates.dropoff_country = data.dropoffAddress.country;
    if (data.dropoffAddress.coordinates) {
      updates.dropoff_lat = data.dropoffAddress.coordinates.latitude;
      updates.dropoff_lng = data.dropoffAddress.coordinates.longitude;
    }
  }
  await db.update(deliveries).set(updates).where(eq(deliveries.id, id));
}

export async function deleteDelivery(id: string): Promise<void> {
  const db = getDb();
  await db.delete(deliveries).where(eq(deliveries.id, id));
}

// ─── Fleet Summary ────────────────────────────────────────

export async function getFleetSummary(fleetId?: string) {
  const db = getDb();

  const vc = fleetId
    ? db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.fleet_id, fleetId))
    : db.select({ count: sql<number>`count(*)` }).from(vehicles);
  const dc = fleetId
    ? db.select({ count: sql<number>`count(*)` }).from(drivers).where(eq(drivers.fleet_id, fleetId))
    : db.select({ count: sql<number>`count(*)` }).from(drivers);
  const dlc = fleetId
    ? db.select({ count: sql<number>`count(*)` }).from(deliveries).where(eq(deliveries.fleet_id, fleetId))
    : db.select({ count: sql<number>`count(*)` }).from(deliveries);

  const [totalVehicles] = await vc;
  const [totalDrivers] = await dc;
  const [totalDeliveries] = await dlc;

  // Active drivers
  const adCond = fleetId
    ? and(eq(drivers.fleet_id, fleetId), sql`${drivers.status} != 'offline'`)
    : sql`${drivers.status} != 'offline'`;
  const [activeDrivers] = await db.select({ count: sql<number>`count(*)` }).from(drivers).where(adCond);

  // Active vehicles
  const avCond = fleetId
    ? and(eq(vehicles.fleet_id, fleetId), eq(vehicles.status, "active"))
    : eq(vehicles.status, "active");
  const [activeVehicles] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(avCond);

  // Deliveries today
  const dtCond = fleetId
    ? and(
        eq(deliveries.fleet_id, fleetId),
        sql`${deliveries.status} IN ('in_transit', 'picked_up', 'delivered')`
      )
    : sql`${deliveries.status} IN ('in_transit', 'picked_up', 'delivered')`;
  const [deliveriesToday] = await db.select({ count: sql<number>`count(*)` }).from(deliveries).where(dtCond);

  // Maintenance alerts
  const maCond = fleetId
    ? and(
        eq(vehicles.fleet_id, fleetId),
        sql`${vehicles.status} IN ('maintenance', 'out_of_service')`
      )
    : sql`${vehicles.status} IN ('maintenance', 'out_of_service')`;
  const [maintenanceAlerts] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(maCond);

  const tv = totalVehicles?.count ?? 0;
  const av = activeVehicles?.count ?? 0;

  return {
    totalVehicles: tv,
    activeDrivers: activeDrivers?.count ?? 0,
    deliveriesToday: deliveriesToday?.count ?? 0,
    fleetUtilizationPercent: tv > 0 ? Math.round((av / tv) * 100) : 0,
    totalDistanceKm: 0,
    fuelCostTotal: 0,
    maintenanceAlerts: maintenanceAlerts?.count ?? 0,
  };
}

// ─── GPS Update ───────────────────────────────────────────

export async function updateVehicleGps(id: string, lat: number, lng: number): Promise<void> {
  const db = getDb();
  await db.update(vehicles)
    .set({
      current_location_lat: lat,
      current_location_lng: lng,
      updated_at: new Date(),
    })
    .where(eq(vehicles.id, id));
}

// ─── Helpers (backward compat) ────────────────────────────

export function rowToVehicle(row: any): any {
  return mapVehicle(row);
}

export function rowToDriver(row: any): any {
  return mapDriver(row);
}

export function rowToDelivery(row: any): any {
  return mapDelivery(row);
}
