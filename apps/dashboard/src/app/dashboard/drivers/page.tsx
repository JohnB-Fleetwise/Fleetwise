"use client";

import { useState } from "react";
import { useFleetStore } from "@/lib/store";
import { getDriverDisplay } from "@/lib/mock-data";
import type { Driver, DriverStatus } from "@fleetwise/shared";

const STATUSES: DriverStatus[] = ["available", "on_delivery", "offline"];

function statusBadge(status: DriverStatus) {
  const map: Record<string, string> = {
    available: "bg-green-100 text-green-700",
    on_delivery: "bg-blue-100 text-blue-700",
    offline: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function uid(): string {
  return "D-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function DriversPage() {
  const { drivers, vehicles, addDriver, updateDriver, deleteDriver, assignDriverVehicle } = useFleetStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [assigningDriver, setAssigningDriver] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
  });

  const openNew = () => {
    setEditingId(null);
    setForm({ name: "", email: "", phone: "", licenseNumber: "" });
    setShowForm(true);
  };

  const openEdit = (d: Driver) => {
    setEditingId(d.id);
    const display = getDriverDisplay(d);
    setForm({
      name: display.name,
      email: display.email,
      phone: d.phoneNumber,
      licenseNumber: d.licenseNumber,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    const now = new Date().toISOString();
    if (editingId) {
      updateDriver(editingId, {
        licenseNumber: form.licenseNumber,
        phoneNumber: form.phone,
      });
    } else {
      addDriver({
        id: uid(),
        fleetId: "fleet-001",
        userId: "user-" + uid(),
        licenseNumber: form.licenseNumber,
        licenseExpiry: new Date(Date.now() + 3 * 365 * 86400000).toISOString(),
        status: "available",
        rating: 0,
        totalDeliveries: 0,
        phoneNumber: form.phone,
        createdAt: now,
        updatedAt: now,
      });
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteDriver(id);
    setConfirmDelete(null);
  };

  const getVehicleName = (vehicleId?: string) => {
    if (!vehicleId) return "—";
    const v = vehicles.find((v) => v.id === vehicleId);
    return v ? v.name : "—";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-500 mt-1">{drivers.length} drivers in fleet</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-fleet-600 text-white text-sm font-medium rounded-lg hover:bg-fleet-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Driver
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Vehicle</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {drivers.map((d) => {
              const display = getDriverDisplay(d);
              return (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{display.name}</p>
                    <p className="text-xs text-gray-400">{display.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{d.phoneNumber}</td>
                  <td className="px-6 py-4">{statusBadge(d.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{getVehicleName(d.assignedVehicleId)}</span>
                      <button
                        onClick={() => setAssigningDriver(d.id)}
                        className="text-xs text-fleet-600 hover:text-fleet-700 font-medium"
                      >
                        Change
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-600">{d.rating.toFixed(1)}</span>
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(d)}
                        className="p-1.5 text-gray-400 hover:text-fleet-600 rounded hover:bg-gray-100"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
              );
            })}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No drivers yet. Click &ldquo;Add Driver&rdquo; to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {drivers.map((d) => {
          const display = getDriverDisplay(d);
          return (
            <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{display.name}</p>
                  <p className="text-xs text-gray-400">{display.email}</p>
                </div>
                {statusBadge(d.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Phone:</span>{" "}
                  <span className="text-gray-700">{d.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400">Rating:</span>{" "}
                  <span className="text-gray-700">⭐ {d.rating.toFixed(1)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Vehicle:</span>{" "}
                  <span className="text-gray-700">{getVehicleName(d.assignedVehicleId)}</span>
                  <button
                    onClick={() => setAssigningDriver(d.id)}
                    className="ml-2 text-fleet-600 font-medium"
                  >
                    Change
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                <button
                  onClick={() => openEdit(d)}
                  className="flex-1 py-1.5 text-xs font-medium text-fleet-600 bg-fleet-50 rounded-lg hover:bg-fleet-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(d.id)}
                  className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign vehicle modal */}
      {assigningDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAssigningDriver(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Vehicle</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  assignDriverVehicle(assigningDriver, undefined);
                  setAssigningDriver(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-gray-500"
              >
                — Unassigned —
              </button>
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    assignDriverVehicle(assigningDriver, v.id);
                    setAssigningDriver(null);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-fleet-50 text-gray-700 flex items-center justify-between"
                >
                  <span>{v.name} ({v.licensePlate})</span>
                  {v.assignedDriverId === assigningDriver && (
                    <span className="text-xs text-fleet-600 font-medium">Current</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setAssigningDriver(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Driver" : "Add Driver"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Sarah Chen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="driver@fleetwise.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1-415-555-0100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  placeholder="DL-CA-1234567"
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
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-fleet-600 rounded-lg hover:bg-fleet-700"
              >
                {editingId ? "Save Changes" : "Add Driver"}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Driver</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this driver? This action cannot be undone.
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
