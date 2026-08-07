import { NextRequest, NextResponse } from "next/server";
import { createMessage, getMessagesForDriver, getDriverById } from "@/lib/db";
import { requireFleetId, getSessionUserId } from "@/lib/auth-helpers";

// GET /api/messages?driverId=<driverId>
// Returns the driver's messages (newest first, last 50), scoped to the
// authenticated user's fleet.
export async function GET(req: NextRequest) {
  const fleetId = await requireFleetId();
  const driverId = req.nextUrl.searchParams.get("driverId");
  if (!driverId) {
    return NextResponse.json({ error: "driverId query param is required" }, { status: 400 });
  }
  const driver = await getDriverById(driverId, fleetId);
  if (!driver) {
    return NextResponse.json({ error: "Driver not found in this fleet" }, { status: 404 });
  }
  const msgs = await getMessagesForDriver(driverId, fleetId);
  return NextResponse.json(msgs);
}

// POST /api/messages
// Body: { recipientDriverId: string, deliveryId?: string, text: string }
// Sender is the authenticated session user.
export async function POST(req: NextRequest) {
  const fleetId = await requireFleetId();
  const senderId = await getSessionUserId();
  if (!senderId) {
    return NextResponse.json({ error: "Unauthorized: no user in session" }, { status: 401 });
  }

  let data: any;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { recipientDriverId, deliveryId, text } = data;
  if (!recipientDriverId || typeof recipientDriverId !== "string") {
    return NextResponse.json({ error: "recipientDriverId is required" }, { status: 400 });
  }
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  // Messages are scoped to the authenticated fleet — the recipient must be a
  // driver in the same fleet.
  const driver = await getDriverById(recipientDriverId, fleetId);
  if (!driver) {
    return NextResponse.json({ error: "Recipient driver not found in this fleet" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const msg = {
    id: "MSG-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    fleetId,
    senderId,
    recipientDriverId,
    deliveryId: deliveryId && typeof deliveryId === "string" ? deliveryId : undefined,
    text: text.trim(),
    createdAt: now,
  };
  await createMessage(msg);
  return NextResponse.json(msg, { status: 201 });
}
