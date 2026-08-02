"use client";

import { useEffect, useState } from "react";
import { useFleetStore } from "@/lib/store";
import { geocodeAddress } from "@/lib/geocode";
import type { Address } from "@fleetwise/shared";

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none";

export default function SettingsPage() {
  const { fleetSettings, setHomeLocation } = useFleetStore();
  const homeLocation = fleetSettings?.homeLocation;

  const [editing, setEditing] = useState(!homeLocation);
  const [form, setForm] = useState({
    street: homeLocation?.street ?? "",
    city: homeLocation?.city ?? "",
    state: homeLocation?.state ?? "FL",
    zipCode: homeLocation?.zipCode ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Keep the summary view in sync once settings finish loading
  useEffect(() => {
    if (!homeLocation || editing) return;
    setForm({
      street: homeLocation.street,
      city: homeLocation.city,
      state: homeLocation.state,
      zipCode: homeLocation.zipCode,
    });
  }, [homeLocation, editing]);

  const handleSave = async () => {
    const street = form.street.trim();
    const city = form.city.trim();
    if (!street || !city) {
      setError("Street and city are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const full = [street, city, form.state.trim(), form.zipCode.trim()]
        .filter(Boolean)
        .join(", ");
      const coords = await geocodeAddress(full);

      const address: Address = {
        street,
        city,
        state: form.state.trim() || "FL",
        zipCode: form.zipCode.trim(),
        country: "US",
        coordinates: coords ?? undefined,
      };

      await setHomeLocation(address);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        "Failed to save home location: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your fleet&apos;s home base and preferences.
        </p>
      </div>

      {/* Home Location card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Home Location (Depot)</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Your base of operations. Shown on the map and used as the default pickup origin for new deliveries.
            </p>
          </div>
          {homeLocation && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-fleet-700 bg-fleet-50 rounded-lg hover:bg-fleet-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        <div className="p-6">
          {!homeLocation && !editing ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : !editing && homeLocation ? (
            /* Summary view */
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">
                  🏠
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{homeLocation.street}</p>
                  <p className="text-sm text-gray-500">
                    {[homeLocation.city, homeLocation.state, homeLocation.zipCode, homeLocation.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {homeLocation.coordinates ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-green-700 font-medium">Geocoded</span>
                    <span className="text-gray-400">
                      ({homeLocation.coordinates.latitude.toFixed(4)}, {homeLocation.coordinates.longitude.toFixed(4)})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-amber-700 font-medium">
                      Coordinates unavailable — map marker and pickup prefill will be limited
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Updated {fleetSettings?.updatedAt ? new Date(fleetSettings.updatedAt).toLocaleString() : "recently"}
              </p>
            </div>
          ) : (
            /* Edit form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  className={inputClass}
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  placeholder="340 SE 2nd St"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Miami"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    className={inputClass}
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="FL"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    className={inputClass}
                    value={form.zipCode}
                    onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                    placeholder="33101"
                  />
                </div>
                <div />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              {saved && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  Home location saved ✓
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                {homeLocation && (
                  <button
                    onClick={() => {
                      setEditing(false);
                      setError(null);
                      if (homeLocation) {
                        setForm({
                          street: homeLocation.street,
                          city: homeLocation.city,
                          state: homeLocation.state,
                          zipCode: homeLocation.zipCode,
                        });
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-4 py-2 text-sm font-medium text-white bg-fleet-600 rounded-lg hover:bg-fleet-700 ${
                    saving ? "opacity-60 cursor-wait" : ""
                  }`}
                >
                  {saving ? "Saving…" : "Save Home Location"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
