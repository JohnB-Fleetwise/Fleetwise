import { NextRequest, NextResponse } from "next/server";
import { getDeliveries, createDelivery } from "@/lib/db";
import { requireFleetId } from "@/lib/auth-helpers";
import { getDriveTimeSeconds } from "@/lib/maps";

const DEFAULT_ETA_FALLBACK_MS = 2 * 3600000; // 2h — same as the DB layer safety net

export async function GET() {
  const fleetId = await requireFleetId();
  const deliveries = await getDeliveries(fleetId);
  return NextResponse.json(deliveries);
}

export async function POST(req: NextRequest) {
  const fleetId = await requireFleetId();
  const data = await req.json();
  const now = new Date().toISOString();
  const scheduledPickupTime = data.scheduledPickupTime || now;

  // Default fallback (now + 2h). Replaced by a real Google Maps drive-time ETA
  // whenever pickup/dropoff coordinates are available.
  let scheduledDropoffTime =
    data.scheduledDropoffTime || new Date(Date.now() + DEFAULT_ETA_FALLBACK_MS).toISOString();
  let estimatedDurationMin: number | undefined = data.estimatedDurationMin || undefined;

  const origin = data.pickupAddress?.coordinates;
  const dest = data.dropoffAddress?.coordinates;
  if (origin && dest) {
    const driveTimeSeconds = await getDriveTimeSeconds(
      { lat: origin.latitude, lng: origin.longitude },
      { lat: dest.latitude, lng: dest.longitude }
    );
    if (driveTimeSeconds != null) {
      scheduledDropoffTime = new Date(
        new Date(scheduledPickupTime).getTime() + driveTimeSeconds * 1000
      ).toISOString();
      estimatedDurationMin = Math.round(driveTimeSeconds / 60);
    } else {
      console.warn(
        "[deliveries] Google Maps drive time unavailable — falling back to default ETA (now + 2h)"
      );
    }
  }

  const delivery = {
    id: "DLV-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    fleetId,
    driverId: data.driverId || "",
    vehicleId: data.vehicleId || "",
    status: data.status || "pending",
    orderNumber: data.orderNumber || undefined,
    pickupAddress: data.pickupAddress || { street: "", city: "", state: "FL", zipCode: "", country: "US" },
    dropoffAddress: data.dropoffAddress || { street: data.address || "", city: "", state: "FL", zipCode: "", country: "US" },
    scheduledPickupTime,
    scheduledDropoffTime,
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
    distanceMi: data.distanceMi || undefined,
    estimatedDurationMin,
    createdAt: now,
    updatedAt: now,
  };
  await createDelivery(delivery);
  return NextResponse.json(delivery, { status: 201 });
}
