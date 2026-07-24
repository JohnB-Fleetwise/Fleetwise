import { NextRequest, NextResponse } from "next/server";
import { getDriverById, updateDriver, deleteDriver } from "@/lib/db";
import { requireFleetId } from "@/lib/auth-helpers";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const fleetId = await requireFleetId();
  const driver = await getDriverById(params.id, fleetId);
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  return NextResponse.json(driver);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const fleetId = await requireFleetId();
  const data = await req.json();
  const existing = await getDriverById(params.id, fleetId);
  if (!existing) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  await updateDriver(params.id, data);
  const updated = await getDriverById(params.id, fleetId);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const fleetId = await requireFleetId();
  const existing = await getDriverById(params.id, fleetId);
  if (!existing) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  await deleteDriver(params.id);
  return NextResponse.json({ success: true });
}
