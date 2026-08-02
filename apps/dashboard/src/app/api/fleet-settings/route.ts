import { NextRequest, NextResponse } from "next/server";
import { getFleetSettings, upsertFleetSettings } from "@/lib/db";
import { requireFleetId } from "@/lib/auth-helpers";
import { geocodeAddress } from "@/lib/geocode";

// GET /api/fleet-settings — return the fleet's settings (or { homeLocation: null } if unset)
export async function GET() {
  const fleetId = await requireFleetId();
  const settings = await getFleetSettings(fleetId);
  if (!settings) return NextResponse.json({ homeLocation: null });
  return NextResponse.json(settings);
}

// PUT /api/fleet-settings — upsert the fleet's home location.
// Body: { homeLocation: Address }. Geocodes when coordinates are missing.
export async function PUT(req: NextRequest) {
  const fleetId = await requireFleetId();
  const data = await req.json();
  const homeLocation = data?.homeLocation;

  if (!homeLocation || !homeLocation.street || !homeLocation.city) {
    return NextResponse.json(
      { error: "Street and city are required." },
      { status: 400 }
    );
  }

  // Geocode only if the client didn't already provide coordinates
  if (!homeLocation.coordinates) {
    const full = [
      homeLocation.street,
      homeLocation.city,
      homeLocation.state,
      homeLocation.zipCode,
    ]
      .filter(Boolean)
      .join(", ")
      .trim();
    const coords = await geocodeAddress(full);
    if (coords) homeLocation.coordinates = coords;
  }

  const settings = await upsertFleetSettings(fleetId, {
    homeLocation: {
      street: homeLocation.street,
      city: homeLocation.city,
      state: homeLocation.state || "FL",
      zipCode: homeLocation.zipCode || "",
      country: homeLocation.country || "US",
      coordinates: homeLocation.coordinates,
    },
  });

  return NextResponse.json(settings);
}
