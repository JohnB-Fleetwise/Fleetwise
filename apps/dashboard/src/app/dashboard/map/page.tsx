"use client";

import { useEffect, useState, useCallback } from "react";
import { useFleetStore } from "@/lib/store";
import { getVehicleDriverName } from "@/lib/mock-data";
import type { Vehicle, Delivery } from "@fleetwise/shared";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false });

function statusColor(status: string): string {
  switch (status) {
    case "active":
      return "#22c55e";
    case "idle":
      return "#eab308";
    case "maintenance":
      return "#f97316";
    case "out_of_service":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

function createIcon(color: string, label?: string) {
  if (typeof window === "undefined") return undefined;
  const L = (window as any).L;
  if (!L) return undefined;
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: bold; color: white;
    ">${label || ""}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function createDeliveryIcon(color: string, letter: string) {
  if (typeof window === "undefined") return undefined;
  const L = (window as any).L;
  if (!L) return undefined;
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 24px; height: 24px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: bold; color: white;
    ">${letter}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

function VehicleMarkers({ vehicles, deliveries }: { vehicles: Vehicle[]; deliveries: Delivery[] }) {
  if (typeof window === "undefined") return null;

  // Compute set of vehicle IDs that are assigned to an active (in-progress) delivery
  const activeDeliveryVehicleIds = new Set(
    deliveries
      .filter(
        (d) =>
          d.status !== "delivered" &&
          d.status !== "cancelled" &&
          d.status !== "failed"
      )
      .map((d) => d.vehicleId)
  );

  // Only show vehicles that are "active" OR assigned to an active delivery
  const visibleVehicles = vehicles.filter(
    (v) => v.status === "active" || activeDeliveryVehicleIds.has(v.id)
  );

  return (
    <>
      {visibleVehicles.map((v) => {
        if (!v.currentLocation) return null;
        const icon = createIcon(statusColor(v.status));
        if (!icon) return null;
        return (
          <Marker
            key={v.id}
            position={[v.currentLocation.latitude, v.currentLocation.longitude]}
            icon={icon}
          >
            <Popup>
              <div className="text-sm min-w-[140px]">
                <p className="font-semibold text-gray-900">{v.name}</p>
                <p className="text-gray-500 text-xs">Driver: {getVehicleDriverName(v)}</p>
                <p className="text-gray-500 text-xs">
                  Status: <span className="font-medium capitalize">{v.status.replace("_", " ")}</span>
                </p>
                <p className="text-gray-400 text-[10px] mt-1">
                  Updated: {new Date(v.updatedAt).toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

// ─── Delivery Layer ────────────────────────────────────

interface RouteGeometry {
  coordinates: [number, number][];
}

async function fetchRoute(
  pickupLng: number,
  pickupLat: number,
  dropoffLng: number,
  dropoffLat: number
): Promise<RouteGeometry | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return null;
    return data.routes[0].geometry as RouteGeometry;
  } catch (err) {
    console.warn("[DeliveryLayer] OSRM route fetch failed:", err);
    return null;
  }
}

function DeliveryLayer({ deliveries }: { deliveries: Delivery[] }) {
  const [routes, setRoutes] = useState<Record<string, RouteGeometry | null>>({});
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const activeDeliveries = deliveries.filter(
      (d) =>
        d.status !== "delivered" &&
        d.status !== "cancelled" &&
        d.status !== "failed"
    );

    const deliveriesWithCoords = activeDeliveries.filter(
      (d) =>
        d.pickupAddress?.coordinates &&
        d.dropoffAddress?.coordinates
    );

    if (deliveriesWithCoords.length === 0) {
      setRoutes({});
      return;
    }

    let cancelled = false;

    const fetchAllRoutes = async () => {
      setFetching(true);
      const result: Record<string, RouteGeometry | null> = {};

      for (const d of deliveriesWithCoords) {
        if (cancelled) return;

        const pCoords = d.pickupAddress!.coordinates!;
        const dCoords = d.dropoffAddress!.coordinates!;

        const geometry = await fetchRoute(
          pCoords.longitude,
          pCoords.latitude,
          dCoords.longitude,
          dCoords.latitude
        );

        if (!cancelled) {
          result[d.id] = geometry;
          // Small delay to avoid hammering OSRM
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      if (!cancelled) {
        setRoutes(result);
        setFetching(false);
      }
    };

    fetchAllRoutes();

    return () => {
      cancelled = true;
    };
  }, [deliveries]);

  if (typeof window === "undefined") return null;

  return (
    <>
      {deliveries
        .filter(
          (d) =>
            d.status !== "delivered" &&
            d.status !== "cancelled" &&
            d.status !== "failed"
        )
        .map((d) => {
        const pCoords = d.pickupAddress?.coordinates;
        const dCoords = d.dropoffAddress?.coordinates;

        if (!pCoords && !dCoords) return null;

        const pickupIcon = createDeliveryIcon("#22c55e", "P");
        const dropoffIcon = createDeliveryIcon("#ef4444", "D");
        if (!pickupIcon && !dropoffIcon) return null;

        const routeGeo = routes[d.id];

        return (
          <span key={d.id}>
            {/* Pickup marker (green) - only if coordinates exist */}
            {pCoords && pickupIcon && (
              <Marker
                position={[pCoords.latitude, pCoords.longitude]}
                icon={pickupIcon}
              >
                <Popup>
                  <div className="text-sm min-w-[160px]">
                    <p className="font-semibold text-gray-900">{d.customerName}</p>
                    <p className="text-gray-500 text-xs">Pickup: {d.pickupAddress.street}</p>
                    <p className="text-gray-500 text-xs">
                      Priority: <span className="font-medium capitalize">{d.priority}</span>
                    </p>
                    <p className="text-gray-400 text-[10px] mt-1">{d.id}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Dropoff marker (red) - only if coordinates exist */}
            {dCoords && dropoffIcon && (
              <Marker
                position={[dCoords.latitude, dCoords.longitude]}
                icon={dropoffIcon}
              >
                <Popup>
                  <div className="text-sm min-w-[160px]">
                    <p className="font-semibold text-gray-900">{d.customerName}</p>
                    <p className="text-gray-500 text-xs">Dropoff: {d.dropoffAddress.street}</p>
                    <p className="text-gray-500 text-xs">
                      Priority: <span className="font-medium capitalize">{d.priority}</span>
                    </p>
                    <p className="text-gray-400 text-[10px] mt-1">{d.id}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route line - only when both coordinates exist */}
            {pCoords && dCoords && routeGeo && routeGeo.coordinates && routeGeo.coordinates.length > 0 && (
              <Polyline
                positions={routeGeo.coordinates.map((c: [number, number]) => [c[1], c[0]])}
                pathOptions={{
                  color: "#2563eb",
                  weight: 3,
                  opacity: 0.6,
                }}
              />
            )}
          </span>
        );
      })}
    </>
  );
}

function VehicleSidebar({
  vehicles,
  selectedId,
  onSelect,
  deliveries,
}: {
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  deliveries: Delivery[];
}) {
  // Compute count of vehicles hidden from the map
  const activeDeliveryVehicleIds = new Set(
    deliveries
      .filter(
        (d) =>
          d.status !== "delivered" &&
          d.status !== "cancelled" &&
          d.status !== "failed"
      )
      .map((d) => d.vehicleId)
  );
  const hiddenCount = vehicles.filter(
    (v) => v.status !== "active" && !activeDeliveryVehicleIds.has(v.id)
  ).length;

  return (
    <div className="bg-white border-b md:border-b-0 md:border-l border-gray-200 md:w-80 md:flex-shrink-0 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Vehicles</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {vehicles.filter((v) => v.status === "active").length} active ·{" "}
          {vehicles.filter((v) => v.status === "idle").length} idle ·{" "}
          {vehicles.filter((v) => v.status === "maintenance" || v.status === "out_of_service").length}{" "}
          offline
        </p>
      </div>
      <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
        {vehicles.map((v) => (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
              selectedId === v.id ? "bg-fleet-50" : ""
            }`}
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: statusColor(v.status) }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{v.name}</p>
              <p className="text-xs text-gray-500">
                {v.licensePlate} · {getVehicleDriverName(v)}
              </p>
            </div>
            <span
              className="text-[10px] font-medium uppercase tracking-wider flex-shrink-0"
              style={{ color: statusColor(v.status) }}
            >
              {v.status === "out_of_service" ? "OOS" : v.status}
            </span>
          </button>
        ))}
      </div>
      {hiddenCount > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            {hiddenCount} idle/maintenance vehicle{hiddenCount !== 1 ? "s" : ""} not shown on map
          </p>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  const { vehicles, deliveries } = useFleetStore();
  const [mounted, setMounted] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeVehicles = vehicles.filter((v) => v.currentLocation);
  const centerLat =
    activeVehicles.length > 0
      ? activeVehicles.reduce((s, v) => s + v.currentLocation!.latitude, 0) / activeVehicles.length
      : 28.5;
  const centerLng =
    activeVehicles.length > 0
      ? activeVehicles.reduce((s, v) => s + v.currentLocation!.longitude, 0) / activeVehicles.length
      : -81.4;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -m-4 md:-m-6">
      {/* Mobile sidebar at top */}
      <div className="md:hidden">
        <VehicleSidebar vehicles={vehicles} selectedId={selectedVehicle} onSelect={setSelectedVehicle} deliveries={deliveries} />
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Map */}
        <div className="flex-1 min-h-[300px] md:min-h-0">
          {mounted && (
            <MapContainer
              center={[centerLat, centerLng]}
              zoom={7}
              className="w-full h-full"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <VehicleMarkers vehicles={vehicles} deliveries={deliveries} />
              <DeliveryLayer deliveries={deliveries} />
            </MapContainer>
          )}
          {!mounted && (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <p className="text-gray-400">Loading map...</p>
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <VehicleSidebar vehicles={vehicles} selectedId={selectedVehicle} onSelect={setSelectedVehicle} deliveries={deliveries} />
        </div>
      </div>
    </div>
  );
}
