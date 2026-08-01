// ─── Vehicle ──────────────────────────────────────────
export interface Vehicle {
  id: string;
  fleetId: string;
  name: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  status: VehicleStatus;
  currentLocation?: GeoPoint;
  odometerKm: number;
  fuelType: FuelType;
  fuelCapacityL: number;
  assignedDriverId?: string;
  category: VehicleCategory;
  insuranceExpiry: string; // ISO date
  registrationExpiry: string; // ISO date
  createdAt: string;
  updatedAt: string;
}

export type VehicleStatus =
  | "active"
  | "idle"
  | "maintenance"
  | "out_of_service";

export type VehicleCategory =
  | "van"
  | "truck"
  | "car"
  | "motorcycle"
  | "other";

// ─── Driver ───────────────────────────────────────────
export interface Driver {
  id: string;
  fleetId: string;
  userId: string;
  name?: string;
  email?: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: DriverStatus;
  rating: number; // 1-5
  totalDeliveries: number;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
}

export type DriverStatus = "available" | "on_delivery" | "offline";

// ─── Delivery ─────────────────────────────────────────
export interface Delivery {
  id: string;
  fleetId: string;
  driverId: string;
  vehicleId: string;
  status: DeliveryStatus;
  pickupAddress: Address;
  dropoffAddress: Address;
  scheduledPickupTime: string;
  scheduledDropoffTime: string;
  actualPickupTime?: string;
  actualDropoffTime?: string;
  packageDescription: string;
  packageWeightKg?: number;
  specialInstructions?: string;
  priority: "low" | "normal" | "high" | "urgent";
  customerName: string;
  customerPhone: string;
  signatureRequired: boolean;
  paymentCollected: number; // cents
  distanceKm?: number;
  estimatedDurationMin?: number;
  createdAt: string; // ISO 8601 — when the delivery was assigned/created
  completedAt?: string; // ISO 8601 — when the delivery was completed (delivered)
  updatedAt: string;
}

export enum DeliveryStatus {
  Pending = "pending",
  Assigned = "assigned",
  PickedUp = "picked_up",
  InTransit = "in_transit",
  Delivered = "delivered",
  Failed = "failed",
  Cancelled = "cancelled",
}

// ─── Maintenance ──────────────────────────────────────
export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  status: MaintenanceStatus;
  scheduledDate: string;
  completedDate?: string;
  odometerKm: number;
  cost: number; // cents
  vendor?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceType =
  | "oil_change"
  | "tire_rotation"
  | "brake_service"
  | "engine_tune_up"
  | "transmission_service"
  | "inspection"
  | "repair"
  | "other";

export type MaintenanceStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

// ─── Fuel ─────────────────────────────────────────────
export interface FuelRecord {
  id: string;
  vehicleId: string;
  driverId: string;
  fuelType: FuelType;
  quantityL: number;
  costPerLiter: number; // cents
  totalCost: number; // cents
  odometerKm: number;
  location?: GeoPoint;
  station?: string;
  receiptUrl?: string;
  timestamp: string;
  createdAt: string;
}

export type FuelType = "regular" | "premium" | "diesel" | "electric";

// ─── User ─────────────────────────────────────────────
export interface User {
  id: string;
  fleetId: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "admin" | "manager" | "driver";

// ─── Common Primitives ───────────────────────────────
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: GeoPoint;
}

// ─── Dashboard Stats ─────────────────────────────────
export interface FleetSummary {
  totalVehicles: number;
  activeDrivers: number;
  deliveriesToday: number;
  fleetUtilizationPercent: number;
  totalDistanceKm: number;
  fuelCostTotal: number; // cents
  maintenanceAlerts: number;
}

// ─── API Types ────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: string;
  direction: SortDirection;
}
