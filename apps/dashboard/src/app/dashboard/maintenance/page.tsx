"use client";

import { useState } from "react";
import { useFleetStore } from "@/lib/store";
import { getDriverDisplay } from "@/lib/mock-data";
import type { MaintenanceType } from "@fleetwise/shared";

const MAINTENANCE_TYPES: MaintenanceType[] = [
  "oil_change",
  "tire_rotation",
  "brake_service",
  "inspection",
  "repair",
  "other",
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    maintenance: "bg-orange-100 text-orange-700",
    out_of_service: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        map[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function MaintenancePage() {
  const { vehicles, drivers, deliveries, updateVehicle, updateDriver } =
    useFleetStore();
  const [showForm, setShowForm] = useState(false);

  // A delivery is "active" while it is still in progress (not terminal).
  const hasActiveDelivery = (vehicleId: string) =>
    deliveries.some(
      (d) =>
        d.vehicleId === vehicleId &&
        d.status !== "delivered" &&
        d.status !== "cancelled" &&
        d.status !== "failed"
    );

  const [form, setForm] = useState({
    vehicleId: "",
    type: "oil_change" as MaintenanceType,
    description: "",
    scheduledDate: new Date().toISOString().split("T")[0],
  });

  // Vehicles currently in maintenance or out of service
  const maintenanceVehicles = vehicles.filter(
    (v) => v.status === "maintenance" || v.status === "out_of_service"
  );

  // Vehicles eligible for scheduling maintenance (active or idle — not already
  // in maintenance, and not assigned to an active delivery)
  const schedulableVehicles = vehicles.filter(
    (v) =>
      (v.status === "active" || v.status === "idle") &&
      !hasActiveDelivery(v.id)
  );

  const getDriverForVehicle = (vehicleId?: string): string => {
    if (!vehicleId) return "Unassigned";
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle?.assignedDriverId) return "Unassigned";
    const driver = drivers.find((d) => d.id === vehicle.assignedDriverId);
    return driver ? getDriverDisplay(driver).name : "Unassigned";
  };

  const openScheduleForm = () => {
    setForm({
      vehicleId: schedulableVehicles[0]?.id || "",
      type: "oil_change",
      description: "",
      scheduledDate: new Date().toISOString().split("T")[0],
    });
    setShowForm(true);
  };

  const handleSchedule = async () => {
    if (!form.vehicleId || !form.description) return;

    const vehicle = vehicles.find((v) => v.id === form.vehicleId);

    // Never take a vehicle into maintenance while it is assigned to an
    // active (non-terminal) delivery.
    if (hasActiveDelivery(form.vehicleId)) {
      alert(
        "This vehicle is assigned to an active delivery. Complete or cancel the delivery before scheduling maintenance."
      );
      return;
    }

    // Mark vehicle as maintenance
    await updateVehicle(form.vehicleId, { status: "maintenance" });

    // If the vehicle had an assigned driver, free them (the assignment is on the vehicle)
    if (vehicle?.assignedDriverId) {
      await updateDriver(vehicle.assignedDriverId, {
        status: "available",
      });
    }

    setShowForm(false);
  };

  const handleReturnToService = async (vehicleId: string) => {
    await updateVehicle(vehicleId, { status: "idle" });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-sm text-gray-500 mt-1">
            {maintenanceVehicles.length} vehicle
            {maintenanceVehicles.length !== 1 ? "s" : ""} in maintenance
          </p>
        </div>
        <button
          onClick={openScheduleForm}
          className="inline-flex items-center gap-2 px-4 py-2 bg-fleet-600 text-white text-sm font-medium rounded-lg hover:bg-fleet-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Schedule Maintenance
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plate
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {maintenanceVehicles.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-400 text-sm"
                >
                  No vehicles in maintenance
                </td>
              </tr>
            ) : (
              maintenanceVehicles.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{v.name}</p>
                    <p className="text-xs text-gray-400">
                      {v.make} {v.model} ({v.year})
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {v.licensePlate}
                  </td>
                  <td className="px-6 py-4">{statusBadge(v.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {getDriverForVehicle(v.id)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleReturnToService(v.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Return to Service
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {maintenanceVehicles.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            No vehicles in maintenance
          </div>
        ) : (
          maintenanceVehicles.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-400">
                    {v.make} {v.model} ({v.year})
                  </p>
                </div>
                {statusBadge(v.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Plate:</span>{" "}
                  <span className="text-gray-700 font-medium">
                    {v.licensePlate}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Driver:</span>{" "}
                  <span className="text-gray-700">
                    {getDriverForVehicle(v.id)}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50">
                <button
                  onClick={() => handleReturnToService(v.id)}
                  className="w-full py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Return to Service
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Maintenance modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowForm(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Schedule Maintenance
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none bg-white"
                  value={form.vehicleId}
                  onChange={(e) =>
                    setForm({ ...form, vehicleId: e.target.value })
                  }
                >
                  {schedulableVehicles.length === 0 && (
                    <option value="">No vehicles available</option>
                  )}
                  {schedulableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.licensePlate})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Type *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none bg-white"
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as MaintenanceType,
                    })
                  }
                >
                  {MAINTENANCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe the maintenance needed..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                  value={form.scheduledDate}
                  onChange={(e) =>
                    setForm({ ...form, scheduledDate: e.target.value })
                  }
                />
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
                onClick={handleSchedule}
                disabled={!form.vehicleId || !form.description}
                className="px-4 py-2 text-sm font-medium text-white bg-fleet-600 rounded-lg hover:bg-fleet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
