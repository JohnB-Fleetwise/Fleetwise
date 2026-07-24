import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

// ─── In-memory store (loaded from disk) ────────────────────

interface DbState {
  users: any[];
  vehicles: any[];
  drivers: any[];
  deliveries: any[];
}

let _state: DbState = { users: [], vehicles: [], drivers: [], deliveries: [] };
let _loaded = false;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadState(): DbState {
  ensureDir();
  if (fs.existsSync(DB_PATH)) {
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
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(_state, null, 2));
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
}): Promise<void> {
  const s = state();
  const now = new Date().toISOString();
  s.users.push({
    id: user.id,
    fleetId: "fleet-001",
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

export async function getVehicles() {
  return [...state().vehicles].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getVehicleById(id: string) {
  return state().vehicles.find((v: any) => v.id === id) ?? null;
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

export async function getDrivers() {
  return [...state().drivers].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getDriverById(id: string) {
  return state().drivers.find((d: any) => d.id === id) ?? null;
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

export async function getDeliveries() {
  return [...state().deliveries].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getDeliveryById(id: string) {
  return state().deliveries.find((d: any) => d.id === id) ?? null;
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

export async function getFleetSummary() {
  const s = state();
  const totalVehicles = s.vehicles.length;
  const activeDrivers = s.drivers.filter((d: any) => d.status !== "offline").length;
  const deliveriesToday = s.deliveries.filter(
    (d: any) => ["in_transit", "picked_up", "delivered"].includes(d.status)
  ).length;
  const activeVehicles = s.vehicles.filter((v: any) => v.status === "active").length;
  const fleetUtilizationPercent =
    totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
  const maintenanceAlerts = s.vehicles.filter(
    (v: any) => v.status === "maintenance" || v.status === "out_of_service"
  ).length;

  return {
    totalVehicles,
    activeDrivers,
    deliveriesToday,
    fleetUtilizationPercent,
    totalDistanceKm: 1240,
    fuelCostTotal: 38450,
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
