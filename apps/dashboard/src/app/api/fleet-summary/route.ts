import { NextResponse } from "next/server";
import { getFleetSummary } from "@/lib/db";
import { requireFleetId } from "@/lib/auth-helpers";

export async function GET() {
  const fleetId = await requireFleetId();
  const summary = await getFleetSummary(fleetId);
  return NextResponse.json(summary);
}
