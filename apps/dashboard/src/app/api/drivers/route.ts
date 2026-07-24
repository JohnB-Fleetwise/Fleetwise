import { NextRequest, NextResponse } from "next/server";
import { getDrivers, createDriver } from "@/lib/db";

export async function GET() {
  const drivers = await getDrivers();
  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const now = new Date().toISOString();
  const driver = {
    id: "D-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    fleetId: "fleet-001",
    userId: data.userId || "user-" + Math.random().toString(36).slice(2, 8),
    name: data.name || "",
    email: data.email || "",
    licenseNumber: data.licenseNumber || "",
    licenseExpiry: data.licenseExpiry || new Date(Date.now() + 3 * 365 * 86400000).toISOString(),
    assignedVehicleId: data.assignedVehicleId || undefined,
    status: data.status || "available",
    rating: data.rating || 0,
    totalDeliveries: data.totalDeliveries || 0,
    phoneNumber: data.phoneNumber || "",
    createdAt: now,
    updatedAt: now,
  };
  await createDriver(driver);
  return NextResponse.json(driver, { status: 201 });
}
