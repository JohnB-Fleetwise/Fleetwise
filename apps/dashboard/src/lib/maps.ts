import type { GeoPoint } from "@fleetwise/shared";

/**
 * Google Maps "directions" deep link. The `?api=1` form works without any
 * API key — it opens the Google Maps app / website with turn-by-turn
 * directions to the destination.
 */
export function googleMapsDirectionsUrl(destination: GeoPoint): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
}
