import { NextRequest, NextResponse } from "next/server";
import { getDriverById, updateDriver, deleteDriver } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const driver = await getDriverById(params.id);
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  return NextResponse.json(driver);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const existing = await getDriverById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  await updateDriver(params.id, data);
  const updated = await getDriverById(params.id);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getDriverById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  await deleteDriver(params.id);
  return NextResponse.json({ success: true });
}
