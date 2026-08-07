import { NextRequest, NextResponse } from "next/server";
import { getMessagesByIds, markMessagesAsRead } from "@/lib/db";
import { requireFleetId } from "@/lib/auth-helpers";

// POST /api/messages/read
// Body: { messageIds: string[] }
// Marks the given messages as read (read_at = now()). Only messages that
// belong to the authenticated user's fleet are affected.
export async function POST(req: NextRequest) {
  const fleetId = await requireFleetId();

  let data: any;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messageIds } = data;
  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return NextResponse.json({ error: "messageIds must be a non-empty array" }, { status: 400 });
  }
  if (!messageIds.every((id: unknown) => typeof id === "string")) {
    return NextResponse.json({ error: "messageIds must contain only strings" }, { status: 400 });
  }

  // Scope to the authenticated fleet: only mark messages that exist in it.
  const fleetMessages = await getMessagesByIds(messageIds, fleetId);
  const fleetMessageIds = fleetMessages.map((m) => m.id);
  if (fleetMessageIds.length > 0) {
    await markMessagesAsRead(fleetMessageIds);
  }
  return NextResponse.json({ success: true });
}
