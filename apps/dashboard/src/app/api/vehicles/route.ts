import { NextRequest, NextResponse } from "next/server";
import { getVehicles, createVehicle } from "@/lib/db";

export async function GET() {
  const vehicles = await getVehicles();
  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const now = new Date().toISOString();
  const vehicle = {
    id: "V-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    fleetId: "fleet-001",
    name: data.name,
    make: data.make || "",
    model: data.model || "",
    year: data.year || new Date().getFullYear(),
    licensePlate: data.licensePlate,
    vin: data.vin || "",
    status: data.status || "idle",
    currentLocation: data.currentLocation || undefined,
    odometerKm: data.odometerKm || 0,
    fuelType: data.fuelType || "regular",
    fuelCapacityL: data.fuelCapacityL || 80,
    assignedDriverId: data.assignedDriverId || undefined,
    category: data.category || "van",
    insuranceExpiry: data.insuranceExpiry || new Date(Date.now() + 365 * 86400000).toISOString(),
    registrationExpiry: data.registrationExpiry || new Date(Date.now() + 365 * 86400000).toISOString(),
    createdAt: now,
    updatedAt: now,
  };
  await createVehicle(vehicle);
  return NextResponse.json(vehicle, { status: 201 });
}
