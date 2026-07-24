import { NextResponse } from "next/server";
import { getFleetSummary } from "@/lib/db";

export async function GET() {
  const summary = await getFleetSummary();
  return NextResponse.json(summary);
}
