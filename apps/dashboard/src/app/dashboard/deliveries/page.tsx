"use client";

import { useState } from "react";
import { useFleetStore } from "@/lib/store";
import { getDriverDisplay } from "@/lib/mock-data";
import { DeliveryStatus } from "@fleetwise/shared";
import type { Delivery, Address } from "@fleetwise/shared";
import { geocodeAddress, sleep, getRouteDistance } from "@/lib/geocode";

const STATUS_FLOW: DeliveryStatus[] = [
  DeliveryStatus.Pending,
  DeliveryStatus.Assigned,
  DeliveryStatus.PickedUp,
  DeliveryStatus.InTransit,
  DeliveryStatus.Delivered,
];

function statusBadge(status: DeliveryStatus) {
  const map: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    assigned: "bg-blue-100 text-blue-700",
    picked_up: "bg-indigo-100 text-indigo-700",
    in_transit: "bg-amber-100 text-amber-700",
    delivered: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    cancelled: "bg-gray-200 text-gray-500 line-through",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function statusTimeline(current: DeliveryStatus) {
  const idx = STATUS_FLOW.indexOf(current);
  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_FLOW.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              i <= idx && idx >= 0 ? "bg-fleet-600" : "bg-gray-200"
            }`}
          />
          {i < STATUS_FLOW.length - 1 && (
            <div
              className={`w-6 h-0.5 ${i < idx && idx >= 0 ? "bg-fleet-600" : "bg-gray-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function formatAddress(addr: Address): string {
  const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
  return parts.join(", ") || addr.street;
}

function formatDate(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function uid(): string {
  return "DLV-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function DeliveriesPage() {
  const { deliveries, drivers, vehicles, addDelivery, updateDriver, updateDelivery, deleteDelivery, fleetSettings } = useFleetStore();
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Home location (depot) from settings — default pickup origin
  const homeLocation = fleetSettings?.homeLocation;

  const [form, setForm] = useState({
    customerName: "",
    pickupStreet: "340 SE 2nd St",
    pickupCity: "Miami",
    pickupState: "FL",
    pickupZip: "33131",
    dropoffStreet: "",
    dropoffCity: "",
    dropoffState: "FL",
    dropoffZip: "",
    driverId: "",
    vehicleId: "",
    packageDescription: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
  });

  const openNew = () => {
    const firstAvailable = drivers.find((d) => d.status === "available");
    setForm({
      customerName: "",
      pickupStreet: homeLocation?.street ?? "340 SE 2nd St",
      pickupCity: homeLocation?.city ?? "Miami",
      pickupState: homeLocation?.state ?? "FL",
      pickupZip: homeLocation?.zipCode ?? "33131",
      dropoffStreet: "",
      dropoffCity: "",
      dropoffState: "FL",
      dropoffZip: "",
      driverId: firstAvailable?.id ?? "",
      vehicleId: vehicles.find(v => v.assignedDriverId === firstAvailable?.id)?.id ?? "",
      packageDescription: "",
      priority: "normal",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.customerName || !form.dropoffStreet) return;
    if (!form.driverId || !form.vehicleId) {
      alert("Please select both a driver and a vehicle.");
      return;
    }
    const now = new Date().toISOString();
    const driver = drivers.find((d) => d.id === form.driverId);

    const pickupFull = `${form.pickupStreet}, ${form.pickupCity}, ${form.pickupState} ${form.pickupZip}`;
    const dropoffFull = `${form.dropoffStreet}, ${form.dropoffCity}, ${form.dropoffState} ${form.dropoffZip}`;

    // Use the depot's coordinates when the pickup is the home location —
    // no geocode call needed (coordinates come from fleet settings).
    const pickupIsHome =
      !!homeLocation &&
      homeLocation.street.trim().toLowerCase() === form.pickupStreet.trim().toLowerCase() &&
      homeLocation.city.trim().toLowerCase() === form.pickupCity.trim().toLowerCase();

    let pickupCoords = pickupIsHome ? homeLocation!.coordinates : undefined;

    if (!pickupCoords) {
      pickupCoords = (await geocodeAddress(pickupFull)) ?? undefined;
      await sleep(1500); // Respect Nominatim rate limit
    }

    // Geocode dropoff address
    const dropoffCoords = await geocodeAddress(dropoffFull);

    // Show geocoding warnings
    const warnings: string[] = [];
    if (!pickupCoords) warnings.push("Could not geocode pickup address. The pickup will not appear on the map.");
    if (!dropoffCoords) warnings.push("Could not geocode dropoff address. The dropoff will not appear on the map.");
    if (warnings.length > 0) {
      alert(warnings.join("\n\n"));
    }

    const pickupAddr: Address = {
      street: form.pickupStreet,
      city: form.pickupCity,
      state: form.pickupState,
      zipCode: form.pickupZip,
      country: "US",
      coordinates: pickupCoords ?? undefined,
    };

    const dropoffAddr: Address = {
      street: form.dropoffStreet,
      city: form.dropoffCity,
      state: form.dropoffState,
      zipCode: form.dropoffZip,
      country: "US",
      coordinates: dropoffCoords ?? undefined,
    };

    // Get actual route distance in miles
    let distanceMiles: number | undefined;
    if (pickupCoords && dropoffCoords) {
      distanceMiles = (await getRouteDistance(pickupCoords, dropoffCoords)) ?? undefined;
    }

    try {
      await addDelivery({
        id: uid(),
        fleetId: "fleet-001",
        driverId: form.driverId,
        vehicleId: form.vehicleId,
        status: DeliveryStatus.Pending,
        pickupAddress: pickupAddr,
        dropoffAddress: dropoffAddr,
        scheduledPickupTime: now,
        scheduledDropoffTime: new Date(Date.now() + 2 * 3600000).toISOString(),
        packageDescription: form.packageDescription || "Package",
        priority: form.priority,
        customerName: form.customerName,
        customerPhone: driver?.phoneNumber ?? "",
        signatureRequired: false,
        paymentCollected: 0,
        distanceKm: distanceMiles,
        createdAt: now,
        updatedAt: now,
      } as Delivery);

      // Update driver status to on_delivery
      await updateDriver(form.driverId, { status: "on_delivery" });

      setShowForm(false);
    } catch (err) {
      alert("Failed to create delivery: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const advanceStatus = (id: string) => {
    const d = deliveries.find((dlv) => dlv.id === id);
    if (!d) return;
    const idx = STATUS_FLOW.indexOf(d.status);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
      const next = STATUS_FLOW[idx + 1];
      updateDelivery(id, {
        status: next,
        ...(next === DeliveryStatus.Delivered ? { completedAt: new Date().toISOString() } : {}),
      });
    } else if (d.status === DeliveryStatus.Pending) {
      updateDelivery(id, { status: DeliveryStatus.Assigned });
    }
  };

  const markFailed = (id: string) => {
    updateDelivery(id, { status: DeliveryStatus.Failed });
  };

  const handleDelete = (id: string) => {
    deleteDelivery(id);
    setConfirmDelete(null);
    setDetailId(null);
  };

  const getDriverName = (driverId: string) => {
    const d = drivers.find((dr) => dr.id === driverId);
    if (!d) return "—";
    return getDriverDisplay(d).name;
  };

  const getVehicleName = (vehicleId: string) => {
    const v = vehicles.find((v) => v.id === vehicleId);
    return v ? v.name : "—";
  };

  const detailDelivery = detailId ? deliveries.find((d) => d.id === detailId) : null;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-sm text-gray-500 mt-1">{deliveries.length} deliveries</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-fleet-600 text-white text-sm font-medium rounded-lg hover:bg-fleet-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Delivery
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dropoff</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ETA</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {deliveries.map((d) => (
              <tr
                key={d.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setDetailId(d.id)}
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-mono text-fleet-600">{d.id}</span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.customerName}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-[180px] truncate">
                  {formatAddress(d.dropoffAddress)}
                </td>
                <td className="px-6 py-4">{statusBadge(d.status)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(d.createdAt)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(d.completedAt)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{getDriverName(d.driverId)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(d.scheduledDropoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => advanceStatus(d.id)}
                      className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-gray-100"
                      title="Advance status"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(d.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {deliveries.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No deliveries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {deliveries.map((d) => (
          <div
            key={d.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer"
            onClick={() => setDetailId(d.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{d.customerName}</p>
                <p className="text-xs text-gray-400 font-mono">{d.id}</p>
              </div>
              {statusBadge(d.status)}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Dropoff:</span>{" "}
                <span className="text-gray-700 truncate block">{formatAddress(d.dropoffAddress)}</span>
              </div>
              <div>
                <span className="text-gray-400">Pickup:</span>{" "}
                <span className="text-gray-700 truncate block">{formatAddress(d.pickupAddress)}</span>
              </div>
              <div>
                <span className="text-gray-400">Driver:</span>{" "}
                <span className="text-gray-700">{getDriverName(d.driverId)}</span>
              </div>
              <div>
                <span className="text-gray-400">Vehicle:</span>{" "}
                <span className="text-gray-700">{getVehicleName(d.vehicleId)}</span>
              </div>
              <div>
                <span className="text-gray-400">ETA:</span>{" "}
                <span className="text-gray-700">
                  {new Date(d.scheduledDropoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Created:</span>{" "}
                <span className="text-gray-700">{formatDate(d.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-400">Completed:</span>{" "}
                <span className="text-gray-700">{formatDate(d.completedAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal / slideout */}
      {detailDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{detailDelivery.customerName}</h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{detailDelivery.id}</p>
              </div>
              {statusBadge(detailDelivery.status)}
            </div>

            {/* Status timeline */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status</p>
              {statusTimeline(detailDelivery.status)}
              <p className="text-xs text-gray-400 mt-2">Current: {detailDelivery.status.replace("_", " ")}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Driver</span>
                <span className="text-gray-900 font-medium">{getDriverName(detailDelivery.driverId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle</span>
                <span className="text-gray-900">{getVehicleName(detailDelivery.vehicleId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Package</span>
                <span className="text-gray-900">{detailDelivery.packageDescription}</span>
              </div>
              {detailDelivery.packageWeightKg && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Weight</span>
                  <span className="text-gray-900">{detailDelivery.packageWeightKg} kg</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Priority</span>
                <span className="text-gray-900 capitalize">{detailDelivery.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dropoff</span>
                <span className="text-gray-900 text-right max-w-[200px]">{formatAddress(detailDelivery.dropoffAddress)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pickup</span>
                <span className="text-gray-900 text-right max-w-[200px]">{formatAddress(detailDelivery.pickupAddress)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Distance</span>
                <span className="text-gray-900">
                  {detailDelivery.distanceKm != null ? `${detailDelivery.distanceKm} mi` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ETA</span>
                <span className="text-gray-900">
                  {new Date(detailDelivery.scheduledDropoffTime).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">{formatDate(detailDelivery.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Completed</span>
                <span className="text-gray-900">{formatDate(detailDelivery.completedAt)}</span>
              </div>
              {detailDelivery.specialInstructions && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Notes</span>
                  <span className="text-gray-900 text-right max-w-[200px]">{detailDelivery.specialInstructions}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => advanceStatus(detailDelivery.id)}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-fleet-600 rounded-lg hover:bg-fleet-700"
              >
                Advance Status
              </button>
              <button
                onClick={() => markFailed(detailDelivery.id)}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
              >
                Mark Failed
              </button>
              <button
                onClick={() => { setDetailId(null); setConfirmDelete(detailDelivery.id); }}
                className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Delivery</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Street *</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                  value={form.pickupStreet}
                  onChange={(e) => setForm({ ...form, pickupStreet: e.target.value })}
                  placeholder="340 SE 2nd St"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup City *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                    value={form.pickupCity}
                    onChange={(e) => setForm({ ...form, pickupCity: e.target.value })}
                    placeholder="Miami"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup State</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                    value={form.pickupState}
                    onChange={(e) => setForm({ ...form, pickupState: e.target.value })}
                    placeholder="FL"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup ZIP</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                    value={form.pickupZip}
                    onChange={(e) => setForm({ ...form, pickupZip: e.target.value })}
                    placeholder="33101"
                  />
                </div>
                <div />
              </div>
              <hr className="border-gray-200" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Street *</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                  value={form.dropoffStreet}
                  onChange={(e) => setForm({ ...form, dropoffStreet: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff City *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                    value={form.dropoffCity}
                    onChange={(e) => setForm({ ...form, dropoffCity: e.target.value })}
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff State</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                    value={form.dropoffState}
                    onChange={(e) => setForm({ ...form, dropoffState: e.target.value })}
                    placeholder="FL"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff ZIP</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                    value={form.dropoffZip}
                    onChange={(e) => setForm({ ...form, dropoffZip: e.target.value })}
                    placeholder="94102"
                  />
                </div>
                <div />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none bg-white"
                    value={form.driverId}
                    onChange={(e) => {
                      const newDriverId = e.target.value;
                      setForm({
                        ...form,
                        driverId: newDriverId,
                        vehicleId: vehicles.find(v => v.assignedDriverId === newDriverId)?.id ?? "",
                      });
                    }}
                  >
                    {drivers.map((dr) => (
                      <option key={dr.id} value={dr.id}>
                        {getDriverDisplay(dr).name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none bg-white"
                    value={form.vehicleId}
                    onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Description</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                  value={form.packageDescription}
                  onChange={(e) => setForm({ ...form, packageDescription: e.target.value })}
                  placeholder="Office supplies"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none bg-white"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as "low" | "normal" | "high" | "urgent" })}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-fleet-600 rounded-lg hover:bg-fleet-700"
              >
                Create Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Delivery</h2>
            <p className="text-sm text-gray-500 mb-6">Are you sure?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
