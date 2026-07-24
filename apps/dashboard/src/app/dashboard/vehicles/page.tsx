"use client";

import { useState } from "react";
import { useFleetStore } from "@/lib/store";
import { getVehicleDriverName } from "@/lib/mock-data";
import type { Vehicle, VehicleStatus, VehicleCategory, FuelType } from "@fleetwise/shared";

const CATEGORIES: VehicleCategory[] = ["van", "truck", "car", "motorcycle", "other"];
const FUEL_TYPES: FuelType[] = ["regular", "premium", "diesel", "electric"];
const STATUSES: VehicleStatus[] = ["active", "idle", "maintenance", "out_of_service"];

function statusBadge(status: VehicleStatus) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    idle: "bg-yellow-100 text-yellow-700",
    maintenance: "bg-orange-100 text-orange-700",
    out_of_service: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function uid(): string {
  return "V-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function VehiclesPage() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useFleetStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    licensePlate: "",
    type: "van" as VehicleCategory,
    make: "",
    model: "",
    year: new Date().getFullYear(),
    vin: "",
  });

  const openNew = () => {
    setEditingId(null);
    setForm({ name: "", licensePlate: "", type: "van", make: "", model: "", year: new Date().getFullYear(), vin: "" });
    setShowForm(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      licensePlate: v.licensePlate,
      type: v.category,
      make: v.make,
      model: v.model,
      year: v.year,
      vin: v.vin,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.licensePlate) return;
    if (editingId) {
      updateVehicle(editingId, {
        name: form.name,
        licensePlate: form.licensePlate,
        category: form.type,
        make: form.make,
        model: form.model,
        year: form.year,
        vin: form.vin,
      });
    } else {
      const now = new Date().toISOString();
      addVehicle({
        id: uid(),
        fleetId: "fleet-001",
        name: form.name,
        make: form.make,
        model: form.model,
        year: form.year,
        licensePlate: form.licensePlate,
        vin: form.vin,
        status: "idle",
        odometerKm: 0,
        fuelType: "regular",
        fuelCapacityL: 80,
        category: form.type,
        insuranceExpiry: new Date(Date.now() + 365 * 86400000).toISOString(),
        registrationExpiry: new Date(Date.now() + 365 * 86400000).toISOString(),
        createdAt: now,
        updatedAt: now,
      });
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteVehicle(id);
    setConfirmDelete(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-sm text-gray-500 mt-1">{vehicles.length} vehicles in fleet</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-fleet-600 text-white text-sm font-medium rounded-lg hover:bg-fleet-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Vehicle
        </button>
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Plate</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-400">{v.make} {v.model} ({v.year})</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{v.licensePlate}</td>
                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{v.category}</td>
                <td className="px-6 py-4">{statusBadge(v.status)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{getVehicleDriverName(v)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{v.odometerKm.toLocaleString()} km</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(v)}
                      className="p-1.5 text-gray-400 hover:text-fleet-600 rounded hover:bg-gray-100"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(v.id)}
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
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No vehicles yet. Click &ldquo;Add Vehicle&rdquo; to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Card list (mobile) */}
      <div className="md:hidden space-y-3">
        {vehicles.map((v) => (
          <div key={v.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                <p className="text-xs text-gray-400">{v.make} {v.model} ({v.year})</p>
              </div>
              {statusBadge(v.status)}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Plate:</span>{" "}
                <span className="text-gray-700 font-medium">{v.licensePlate}</span>
              </div>
              <div>
                <span className="text-gray-400">Type:</span>{" "}
                <span className="text-gray-700 capitalize">{v.category}</span>
              </div>
              <div>
                <span className="text-gray-400">Driver:</span>{" "}
                <span className="text-gray-700">{getVehicleDriverName(v)}</span>
              </div>
              <div>
                <span className="text-gray-400">Mileage:</span>{" "}
                <span className="text-gray-700">{v.odometerKm.toLocaleString()} km</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
              <button
                onClick={() => openEdit(v)}
                className="flex-1 py-1.5 text-xs font-medium text-fleet-600 bg-fleet-50 rounded-lg hover:bg-fleet-100"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete(v.id)}
                className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {vehicles.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No vehicles yet.
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Vehicle" : "Add Vehicle"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Van Alpha"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                    value={form.licensePlate}
                    onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none bg-white"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as VehicleCategory })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                    value={form.make}
                    onChange={(e) => setForm({ ...form, make: e.target.value })}
                    placeholder="Ford"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="Transit"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 2024 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                    value={form.vin}
                    onChange={(e) => setForm({ ...form, vin: e.target.value })}
                    placeholder="VIN"
                  />
                </div>
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
                {editingId ? "Save Changes" : "Add Vehicle"}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Vehicle</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </p>
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
