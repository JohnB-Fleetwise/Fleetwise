// ─── Geocoding helper (OpenStreetMap Nominatim) ─────────
// Free, no API key needed. Respects 1 req/sec rate limit.

export interface GeocodedPoint {
  latitude: number;
  longitude: number;
}

/**
 * Convert an address string to lat/lng coordinates using OpenStreetMap Nominatim.
 * Returns null if no result found.
 * Rate-limited to 1 request per second — callers should wait 1.5s between calls.
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodedPoint | null> {
  if (!address || address.trim().length === 0) return null;

  const encoded = encodeURIComponent(address.trim());
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FleetWise/1.0 (fleet-management-app)",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`[geocode] Nominatim returned ${res.status} for "${address}"`);
      return null;
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`[geocode] No results for "${address}"`);
      return null;
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
  } catch (err) {
    console.error(`[geocode] Error geocoding "${address}":`, err);
    return null;
  }
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
