// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useFleetStore } from "@/lib/store";
import { getVehicleDriverName } from "@/lib/mock-data";
import type { Vehicle } from "@fleetwise/shared";
import dynamic from "next/dynamic";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

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

function createIcon(color: string) {
  if (typeof window === "undefined") return undefined;
  const L = (window as any).L ?? require("leaflet");
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 7h8M8 11h5M8 15h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/>
      </svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function VehicleMarkers({ vehicles }: { vehicles: Vehicle[] }) {
  if (typeof window === "undefined") return null;
  return (
    <>
      {vehicles.map((v) => {
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

function VehicleSidebar({
  vehicles,
  selectedId,
  onSelect,
}: {
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="bg-white border-b md:border-b-0 md:border-l border-gray-200 md:w-80 md:flex-shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Vehicles</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {vehicles.filter((v) => v.status === "active").length} active ·{" "}
          {vehicles.filter((v) => v.status === "idle").length} idle ·{" "}
          {vehicles.filter((v) => v.status === "maintenance" || v.status === "out_of_service").length}{" "}
          offline
        </p>
      </div>
      <div className="divide-y divide-gray-50">
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
    </div>
  );
}

export default function MapPage() {
  const { vehicles } = useFleetStore();
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
        <VehicleSidebar vehicles={vehicles} selectedId={selectedVehicle} onSelect={setSelectedVehicle} />
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
              <VehicleMarkers vehicles={vehicles} />
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
          <VehicleSidebar vehicles={vehicles} selectedId={selectedVehicle} onSelect={setSelectedVehicle} />
        </div>
      </div>
    </div>
  );
}
