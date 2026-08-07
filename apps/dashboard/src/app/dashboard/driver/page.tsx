"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useFleetStore } from "@/lib/store";
import { getDriverDisplay } from "@/lib/mock-data";
import { googleMapsDirectionsUrl } from "@/lib/maps";
import { DeliveryStatus, type Address } from "@fleetwise/shared";

/** Send a location update to the API at most once every 3 seconds. */
const TRACKING_DEBOUNCE_MS = 3000;

const ACTIVE_STATUSES = new Set<DeliveryStatus>([
  DeliveryStatus.Pending,
  DeliveryStatus.Assigned,
  DeliveryStatus.PickedUp,
  DeliveryStatus.InTransit,
]);

function formatAddress(addr: Address): string {
  const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
  return parts.join(", ") || addr.street;
}

function statusBadge(status: DeliveryStatus) {
  const map: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    assigned: "bg-blue-100 text-blue-700",
    picked_up: "bg-indigo-100 text-indigo-700",
    in_transit: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DriverViewPage() {
  const { drivers, vehicles, deliveries, loading, messages, unreadCount, fetchMessages, markRead } = useFleetStore();
  const { data: session } = useSession();
  const [messagesOpen, setMessagesOpen] = useState(false);

  // ── Driver selection ─────────────────────────────────────
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  // Auto-detect the driver from the logged-in session user; fall back to the
  // first driver. The user can still override via the dropdown.
  useEffect(() => {
    if (selectedDriverId || drivers.length === 0) return;
    if (sessionUserId) {
      const match = drivers.find((d) => d.userId === sessionUserId);
      if (match) {
        setSelectedDriverId(match.id);
        return;
      }
    }
    const first = drivers[0];
    if (first) setSelectedDriverId(first.id);
  }, [drivers, sessionUserId, selectedDriverId]);

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === selectedDriverId) ?? null,
    [drivers, selectedDriverId]
  );

  // The driver's vehicle is the one assigned to them.
  const vehicle = useMemo(
    () => vehicles.find((v) => v.assignedDriverId === selectedDriverId) ?? null,
    [vehicles, selectedDriverId]
  );

  // Active deliveries assigned to this driver (not delivered / cancelled / failed).
  const activeDeliveries = useMemo(
    () =>
      deliveries.filter(
        (d) =>
          d.driverId === selectedDriverId && ACTIVE_STATUSES.has(d.status)
      ),
    [deliveries, selectedDriverId]
  );

  // ── Messages from dispatch ──────────────────────────────
  const driverMessages = useMemo(
    () => messages.filter((m) => m.recipientDriverId === selectedDriverId),
    [messages, selectedDriverId]
  );

  // Fetch the selected driver's messages on mount and every 10s.
  useEffect(() => {
    if (!selectedDriverId) return;
    let cancelled = false;
    const load = async () => {
      try {
        await fetchMessages(selectedDriverId);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };
    load();
    const t = window.setInterval(load, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [selectedDriverId, fetchMessages]);

  // Mark unread messages as read once the driver opens the panel.
  useEffect(() => {
    if (!messagesOpen || !selectedDriverId) return;
    const unread = driverMessages.filter((m) => !m.readAt);
    if (unread.length > 0) {
      markRead(unread.map((m) => m.id));
    }
  }, [messagesOpen, selectedDriverId, driverMessages, markRead]);

  // ── Tracking state ───────────────────────────────────────
  const [tracking, setTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastReportedAt, setLastReportedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const watchIdRef = useRef<number | null>(null);
  const flushTimerRef = useRef<number | null>(null);
  const vehicleIdRef = useRef<string | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const pendingPosRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const sendNow = useCallback(async () => {
    if (flushTimerRef.current !== null) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    const pending = pendingPosRef.current;
    const vehicleId = vehicleIdRef.current;
    if (!pending || !vehicleId) return;
    pendingPosRef.current = null;
    lastSentAtRef.current = Date.now();
    setLastReportedAt(Date.now());
    try {
      await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentLocation: { latitude: pending.latitude, longitude: pending.longitude },
        }),
      });
    } catch (err) {
      console.error("Failed to update vehicle location:", err);
    }
  }, []);

  // Throttle high-frequency geolocation updates to one PUT per 3s, always
  // flushing the newest position at the end of the debounce window.
  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      pendingPosRef.current = { latitude, longitude };
      setLocationError(null);
      const elapsed = Date.now() - lastSentAtRef.current;
      if (elapsed >= TRACKING_DEBOUNCE_MS) {
        sendNow();
      } else if (flushTimerRef.current === null) {
        flushTimerRef.current = window.setTimeout(sendNow, TRACKING_DEBOUNCE_MS - elapsed);
      }
    },
    [sendNow]
  );

  const handleError = useCallback(() => {
    // Denied permission, or GPS unavailable — surface it but keep the toggle state.
    setLocationError("Location unavailable");
  }, []);

  const startTracking = useCallback(() => {
    if (!selectedDriver || !vehicle) {
      setLocationError("No vehicle is assigned to this driver.");
      return;
    }
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationError("Location unavailable");
      return;
    }
    vehicleIdRef.current = vehicle.id;
    lastSentAtRef.current = 0;
    pendingPosRef.current = null;
    setLocationError(null);
    setLastReportedAt(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    setTracking(true);
  }, [selectedDriver, vehicle, handlePosition, handleError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (flushTimerRef.current !== null) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    vehicleIdRef.current = null;
    pendingPosRef.current = null;
    setTracking(false);
  }, []);

  // Stop tracking on unmount.
  useEffect(() => stopTracking, [stopTracking]);

  // If the driver (or their assigned vehicle) changes mid-tracking, stop
  // so we never report a location to the wrong vehicle.
  useEffect(() => {
    if (tracking && vehicleIdRef.current !== (vehicle?.id ?? null)) {
      stopTracking();
    }
  }, [tracking, vehicle, stopTracking]);

  // Tick every second while tracking so "updated X seconds ago" stays fresh.
  useEffect(() => {
    if (!tracking) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [tracking]);

  const secondsAgo =
    tracking && lastReportedAt !== null
      ? Math.max(0, Math.round((now - lastReportedAt) / 1000))
      : null;

  const driverName = selectedDriver ? getDriverDisplay(selectedDriver).name : "—";

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver View</h1>
          <p className="text-sm text-gray-500 mt-1">Share your live location and navigate to your stops</p>
        </div>
        {/* Status indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            tracking ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
          title={tracking ? "Live tracking active" : "Tracking stopped"}
        >
          <span className="relative flex w-2.5 h-2.5">
            {tracking && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full w-2.5 h-2.5 ${
                tracking ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </span>
          <span className="hidden sm:inline">{tracking ? "Tracking" : "Not tracking"}</span>
        </div>
      </div>

      {/* Driver selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <label htmlFor="driver-select" className="block text-sm font-medium text-gray-700 mb-1.5">
          Driver
        </label>
        <select
          id="driver-select"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-fleet-500 focus:border-transparent outline-none bg-white"
          value={selectedDriverId}
          disabled={loading}
          onChange={(e) => {
            stopTracking();
            setSelectedDriverId(e.target.value);
          }}
        >
          <option value="">{loading ? "Loading drivers…" : "-- Select a driver --"}</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {getDriverDisplay(d).name}
            </option>
          ))}
        </select>
        {vehicle ? (
          <p className="text-xs text-gray-500 mt-2">
            Assigned vehicle: <span className="font-medium text-gray-700">{vehicle.name}</span>
          </p>
        ) : (
          selectedDriver && (
            <p className="text-xs text-amber-600 mt-2">
              No vehicle is assigned to this driver — tracking can&apos;t start.
            </p>
          )
        )}
      </div>

      {/* Tracking toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <button
          onClick={tracking ? stopTracking : startTracking}
          disabled={!selectedDriver || (tracking ? false : !vehicle)}
          className={`w-full py-4 rounded-xl text-lg font-semibold transition-colors flex items-center justify-center gap-3 ${
            tracking
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-fleet-600 text-white hover:bg-fleet-700"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className={`w-3 h-3 rounded-full ${tracking ? "bg-red-500 animate-pulse" : "bg-white/80"}`} />
          {tracking ? "Stop Tracking" : "Start Tracking"}
        </button>

        <div className="mt-3 text-center text-sm">
          {tracking ? (
            lastReportedAt !== null ? (
              <span className="text-gray-600">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                Location updated {secondsAgo === 0 ? "just now" : `${secondsAgo} seconds ago`}
              </span>
            ) : (
              <span className="text-gray-500">Waiting for GPS fix…</span>
            )
          ) : (
            <span className="text-gray-500">Tracking is off — your position is not being shared.</span>
          )}
          {locationError && (
            <p className="mt-1 text-amber-600 font-medium">{locationError}</p>
          )}
        </div>
      </div>

      {/* Messages from dispatch */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
        <button
          onClick={() => setMessagesOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3"
          aria-expanded={messagesOpen}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-fleet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">Messages from Dispatch</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${messagesOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {messagesOpen && (
          <div className="px-4 pb-4">
            {!selectedDriver ? (
              <p className="text-sm text-gray-400 py-2">Select a driver to see their messages.</p>
            ) : driverMessages.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No messages from dispatch yet.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {driverMessages.map((m) => (
                  <li key={m.id} className="bg-fleet-50 border border-fleet-100 rounded-lg px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-800">{m.text}</p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-fleet-600 mt-0.5 uppercase tracking-wide">
                      From dispatch
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Active deliveries */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Active Deliveries</h2>
        <span className="text-sm text-gray-500">{activeDeliveries.length}</span>
      </div>

      {activeDeliveries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400 text-sm">
          {selectedDriver ? "No active deliveries for this driver." : "Select a driver to see their deliveries."}
        </div>
      ) : (
        <div className="space-y-3">
          {activeDeliveries.map((d) => {
            const pickupCoords = d.pickupAddress?.coordinates;
            const dropoffCoords = d.dropoffAddress?.coordinates;
            return (
              <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{d.customerName}</p>
                    <p className="text-xs text-gray-400 font-mono">{d.id}</p>
                  </div>
                  {statusBadge(d.status)}
                </div>
                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  <p>
                    <span className="text-gray-400">Dropoff:</span>{" "}
                    <span className="text-gray-700">{formatAddress(d.dropoffAddress)}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">Pickup:</span>{" "}
                    <span className="text-gray-700">{formatAddress(d.pickupAddress)}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">ETA:</span>{" "}
                    <span className="text-gray-700">
                      {new Date(d.scheduledDropoffTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {d.priority !== "normal" && (
                      <span className="ml-2 uppercase text-[10px] font-semibold text-fleet-600">
                        {d.priority}
                      </span>
                    )}
                  </p>
                </div>
                {/* Navigate buttons — open Google Maps turn-by-turn directions */}
                <div className="flex gap-2">
                  {dropoffCoords && (
                    <a
                      href={googleMapsDirectionsUrl(dropoffCoords)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-fleet-600 text-white text-sm font-medium rounded-lg hover:bg-fleet-700"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Navigate
                    </a>
                  )}
                  {pickupCoords && (
                    <a
                      href={googleMapsDirectionsUrl(pickupCoords)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 border border-fleet-600 text-fleet-700 text-sm font-medium rounded-lg hover:bg-fleet-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4 4 4-4m-4-5V3" />
                      </svg>
                      Pickup
                    </a>
                  )}
                  {!dropoffCoords && !pickupCoords && (
                    <span className="text-xs text-gray-400 py-2.5">No coordinates available for directions</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
