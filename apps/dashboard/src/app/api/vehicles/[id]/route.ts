import { NextRequest, NextResponse } from "next/server";
import { getVehicleById, updateVehicle, deleteVehicle } from "@/lib/db";
import { requireFleetId } from "@/lib/auth-helpers";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const fleetId = await requireFleetId();
  const vehicle = await getVehicleById(params.id, fleetId);
  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }
  return NextResponse.json(vehicle);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const fleetId = await requireFleetId();
  const data = await req.json();
  const existing = await getVehicleById(params.id, fleetId);
  if (!existing) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }
  await updateVehicle(params.id, data);
  const updated = await getVehicleById(params.id, fleetId);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const fleetId = await requireFleetId();
  const existing = await getVehicleById(params.id, fleetId);
  if (!existing) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }
  await deleteVehicle(params.id);
  return NextResponse.json({ success: true });
}
