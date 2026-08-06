import type { GeoPoint } from "@fleetwise/shared";

/**
 * Google Maps "directions" deep link. The `?api=1` form works without any
 * API key — it opens the Google Maps app / website with turn-by-turn
 * directions to the destination.
 */
export function googleMapsDirectionsUrl(destination: GeoPoint): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
}

/**
 * Estimate drive time (seconds) between two coordinates using the Google Maps
 * Distance Matrix API with live traffic (`departure_time=now` +
 * `traffic_model=best_guess`).
 *
 * Returns `null` on any failure (missing key, API error, zero results) so
 * callers can fall back gracefully — never throws.
 *
 * SERVER-SIDE ONLY: reads `GOOGLE_MAPS_API_KEY` from the environment and must
 * never be imported by client components.
 */
export async function getDriveTimeSeconds(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<number | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.warn("[maps] GOOGLE_MAPS_API_KEY is not set — drive-time ETA unavailable");
    return null;
  }
  const url =
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}` +
    `&destinations=${dest.lat},${dest.lng}&departure_time=now&traffic_model=best_guess&key=${key}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[maps] Distance Matrix API returned HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    const element = data?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      console.warn(
        `[maps] Distance Matrix API: no route result (${element?.status ?? "missing element"})`
      );
      return null;
    }
    // `duration_in_traffic` is present when departure_time is supplied; fall back to
    // plain `duration` if Google omits it.
    const seconds = element.duration_in_traffic?.value ?? element.duration?.value ?? null;
    if (typeof seconds !== "number" || seconds < 0) {
      console.warn("[maps] Distance Matrix API: missing duration in response");
      return null;
    }
    return seconds;
  } catch (err) {
    console.error("[maps] Error calling Distance Matrix API:", err);
    return null;
  }
}
