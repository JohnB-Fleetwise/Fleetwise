import { NextRequest, NextResponse } from "next/server";
import { getDeliveries, createDelivery } from "@/lib/db";
import { requireFleetId } from "@/lib/auth-helpers";

export async function GET() {
  const fleetId = await requireFleetId();
  const deliveries = await getDeliveries(fleetId);
  return NextResponse.json(deliveries);
}

export async function POST(req: NextRequest) {
  const fleetId = await requireFleetId();
  const data = await req.json();
  const now = new Date().toISOString();
  const delivery = {
    id: "DLV-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    fleetId,
    driverId: data.driverId || "",
    vehicleId: data.vehicleId || "",
    status: data.status || "pending",
    pickupAddress: data.pickupAddress || { street: "", city: "", state: "FL", zipCode: "", country: "US" },
    dropoffAddress: data.dropoffAddress || { street: data.address || "", city: "", state: "FL", zipCode: "", country: "US" },
    scheduledPickupTime: data.scheduledPickupTime || now,
    scheduledDropoffTime: data.scheduledDropoffTime || new Date(Date.now() + 2 * 3600000).toISOString(),
    actualPickupTime: data.actualPickupTime || undefined,
    actualDropoffTime: data.actualDropoffTime || undefined,
    packageDescription: data.packageDescription || "Package",
    packageWeightKg: data.packageWeightKg || undefined,
    specialInstructions: data.specialInstructions || undefined,
    priority: data.priority || "normal",
    customerName: data.customerName || "",
    customerPhone: data.customerPhone || "",
    signatureRequired: data.signatureRequired || false,
    paymentCollected: data.paymentCollected || 0,
    distanceKm: data.distanceKm || undefined,
    estimatedDurationMin: data.estimatedDurationMin || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await createDelivery(delivery);
  return NextResponse.json(delivery, { status: 201 });
}
