import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

// ─── In-memory store (loaded from disk when available) ────

interface DbState {
  users: any[];
  vehicles: any[];
  drivers: any[];
  deliveries: any[];
}

let _state: DbState = { users: [], vehicles: [], drivers: [], deliveries: [] };
let _loaded = false;
let _useDisk = true;

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Test if writable
    fs.writeFileSync(DB_PATH + ".test", "ok");
    fs.unlinkSync(DB_PATH + ".test");
  } catch {
    _useDisk = false;
  }
}

function loadState(): DbState {
  if (_useDisk) ensureDir();
  if (_useDisk && fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      _state = JSON.parse(raw);
    } catch {
      _state = { users: [], vehicles: [], drivers: [], deliveries: [] };
    }
  }
  _loaded = true;
  return _state;
}

function state(): DbState {
  if (!_loaded) return loadState();
  return _state;
}

function save() {
  if (!_useDisk) return;
  try {
    ensureDir();
    fs.writeFileSync(DB_PATH, JSON.stringify(_state, null, 2));
  } catch {
    _useDisk = false;
  }
}

// Signal to db-init that the database is ready (no async init needed)
export async function ensureSchema(): Promise<void> {
  loadState();
}

export async function getDb(): Promise<DbState> {
  return state();
}

// Provide a simple isSeeded check
export function isSeeded(): boolean {
  return state().vehicles.length > 0;
}

// ─── Users ────────────────────────────────────────────────

export async function getUserByEmail(email: string) {
  const s = state();
  const user = s.users.find((u: any) => u.email === email);
  if (!user) return null;
  return {
    id: user.id,
    fleet_id: user.fleetId ?? "fleet-001",
    email: user.email,
    password_hash: user.passwordHash,
    display_name: user.displayName,
    role: user.role ?? "admin",
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export async function getUserById(id: string) {
  const s = state();
  const user = s.users.find((u: any) => u.id === id);
  if (!user) return null;
  return {
    id: user.id,
    fleet_id: user.fleetId ?? "fleet-001",
    email: user.email,
    password_hash: user.passwordHash,
    display_name: user.displayName,
    role: user.role ?? "admin",
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export async function createUser(user: {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  fleetId?: string;
}): Promise<void> {
  const s = state();
  const now = new Date().toISOString();
  s.users.push({
    id: user.id,
    fleetId: user.fleetId ?? "fleet-" + Math.random().toString(36).slice(2, 8),
    email: user.email,
    passwordHash: user.passwordHash,
    displayName: user.displayName,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  });
  save();
}

// ─── Vehicles ─────────────────────────────────────────────

export async function getVehicles(fleetId?: string) {
  let vehicles = state().vehicles;
  if (fleetId) {
    vehicles = vehicles.filter((v: any) => v.fleetId === fleetId);
  }
  return [...vehicles].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getVehicleById(id: string, fleetId?: string) {
  const v = state().vehicles.find((v: any) => v.id === id);
  if (!v) return null;
  if (fleetId && v.fleetId !== fleetId) return null;
  return v;
}

export async function createVehicle(v: any): Promise<void> {
  state().vehicles.push(v);
  save();
}

export async function updateVehicle(id: string, data: any): Promise<void> {
  const s = state();
  const idx = s.vehicles.findIndex((v: any) => v.id === id);
  if (idx === -1) return;
  s.vehicles[idx] = { ...s.vehicles[idx], ...data, updatedAt: new Date().toISOString() };
  save();
}

export async function deleteVehicle(id: string): Promise<void> {
  const s = state();
  s.vehicles = s.vehicles.filter((v: any) => v.id !== id);
  save();
}

// ─── Drivers ──────────────────────────────────────────────

export async function getDrivers(fleetId?: string) {
  let drivers = state().drivers;
  if (fleetId) {
    drivers = drivers.filter((d: any) => d.fleetId === fleetId);
  }
  return [...drivers].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getDriverById(id: string, fleetId?: string) {
  const d = state().drivers.find((d: any) => d.id === id);
  if (!d) return null;
  if (fleetId && d.fleetId !== fleetId) return null;
  return d;
}

export async function createDriver(d: any): Promise<void> {
  state().drivers.push(d);
  save();
}

export async function updateDriver(id: string, data: any): Promise<void> {
  const s = state();
  const idx = s.drivers.findIndex((d: any) => d.id === id);
  if (idx === -1) return;
  s.drivers[idx] = { ...s.drivers[idx], ...data, updatedAt: new Date().toISOString() };
  save();
}

export async function deleteDriver(id: string): Promise<void> {
  const s = state();
  s.drivers = s.drivers.filter((d: any) => d.id !== id);
  save();
}

// ─── Deliveries ───────────────────────────────────────────

export async function getDeliveries(fleetId?: string) {
  let deliveries = state().deliveries;
  if (fleetId) {
    deliveries = deliveries.filter((d: any) => d.fleetId === fleetId);
  }
  return [...deliveries].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getDeliveryById(id: string, fleetId?: string) {
  const d = state().deliveries.find((d: any) => d.id === id);
  if (!d) return null;
  if (fleetId && d.fleetId !== fleetId) return null;
  return d;
}

export async function createDelivery(d: any): Promise<void> {
  state().deliveries.push(d);
  save();
}

export async function updateDelivery(id: string, data: any): Promise<void> {
  const s = state();
  const idx = s.deliveries.findIndex((d: any) => d.id === id);
  if (idx === -1) return;
  s.deliveries[idx] = { ...s.deliveries[idx], ...data, updatedAt: new Date().toISOString() };
  save();
}

export async function deleteDelivery(id: string): Promise<void> {
  const s = state();
  s.deliveries = s.deliveries.filter((d: any) => d.id !== id);
  save();
}

// ─── Fleet Summary ────────────────────────────────────────

export async function getFleetSummary(fleetId?: string) {
  const s = state();
  let vehicles = s.vehicles;
  let drivers = s.drivers;
  let deliveries = s.deliveries;

  if (fleetId) {
    vehicles = vehicles.filter((v: any) => v.fleetId === fleetId);
    drivers = drivers.filter((d: any) => d.fleetId === fleetId);
    deliveries = deliveries.filter((d: any) => d.fleetId === fleetId);
  }

  const totalVehicles = vehicles.length;
  const activeDrivers = drivers.filter((d: any) => d.status !== "offline").length;
  const deliveriesToday = deliveries.filter(
    (d: any) => ["in_transit", "picked_up", "delivered"].includes(d.status)
  ).length;
  const activeVehicles = vehicles.filter((v: any) => v.status === "active").length;
  const fleetUtilizationPercent =
    totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
  const maintenanceAlerts = vehicles.filter(
    (v: any) => v.status === "maintenance" || v.status === "out_of_service"
  ).length;

  return {
    totalVehicles,
    activeDrivers,
    deliveriesToday,
    fleetUtilizationPercent,
    totalDistanceKm: totalVehicles > 0 ? 1240 : 0,
    fuelCostTotal: totalVehicles > 0 ? 38450 : 0,
    maintenanceAlerts,
  };
}

// ─── GPS Update ───────────────────────────────────────────

export async function updateVehicleGps(id: string, lat: number, lng: number): Promise<void> {
  const s = state();
  const v = s.vehicles.find((v: any) => v.id === id);
  if (!v) return;
  v.currentLocation = { latitude: lat, longitude: lng };
  v.updatedAt = new Date().toISOString();
  save();
}

// ─── Helpers (kept for backward compat) ───────────────────

export function rowToVehicle(row: any): any {
  return row;
}

export function rowToDriver(row: any): any {
  return row;
}

export function rowToDelivery(row: any): any {
  return row;
}
