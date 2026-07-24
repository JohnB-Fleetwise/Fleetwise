import { NextRequest, NextResponse } from "next/server";
import { getVehicleById, updateVehicle, deleteVehicle } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const vehicle = await getVehicleById(params.id);
  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }
  return NextResponse.json(vehicle);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const existing = await getVehicleById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }
  await updateVehicle(params.id, data);
  const updated = await getVehicleById(params.id);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getVehicleById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }
  await deleteVehicle(params.id);
  return NextResponse.json({ success: true });
}
