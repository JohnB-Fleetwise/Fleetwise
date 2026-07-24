import { NextRequest, NextResponse } from "next/server";
import { getDeliveryById, updateDelivery, deleteDelivery } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const delivery = await getDeliveryById(params.id);
  if (!delivery) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }
  return NextResponse.json(delivery);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const existing = await getDeliveryById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }
  await updateDelivery(params.id, data);
  const updated = await getDeliveryById(params.id);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getDeliveryById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }
  await deleteDelivery(params.id);
  return NextResponse.json({ success: true });
}
