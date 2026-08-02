"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Vehicle, Driver, Delivery, Address, FleetSettings } from "@fleetwise/shared";

interface FleetStore {
  vehicles: Vehicle[];
  drivers: Driver[];
  deliveries: Delivery[];
  fleetSettings: FleetSettings | null;
  loading: boolean;
  addVehicle: (v: Vehicle) => Promise<void>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addDriver: (d: Driver) => Promise<void>;
  updateDriver: (id: string, data: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  clockIn: (driverId: string) => Promise<void>;
  clockOut: (driverId: string) => Promise<void>;
  addDelivery: (d: Delivery) => Promise<void>;
  updateDelivery: (id: string, data: Partial<Delivery>) => Promise<void>;
  deleteDelivery: (id: string) => Promise<void>;
  setHomeLocation: (address: Address) => Promise<void>;
}

const FleetContext = createContext<FleetStore | null>(null);

async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export function FleetProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [fleetSettings, setFleetSettings] = useState<FleetSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial data from API
  useEffect(() => {
    async function loadData() {
      try {
        const [v, d, dlv, fs] = await Promise.all([
          fetchJson("/api/vehicles"),
          fetchJson("/api/drivers"),
          fetchJson("/api/deliveries"),
          fetchJson("/api/fleet-settings"),
        ]);
        setVehicles(v);
        setDrivers(d);
        setDeliveries(dlv);
        // The GET returns { homeLocation: null } when nothing is saved yet
        setFleetSettings(fs?.homeLocation ? fs : null);
      } catch (err) {
        console.error("Failed to load fleet data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // GPS simulation every 4 seconds (client-side only)
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status !== "active" || !v.currentLocation) return v;
          return {
            ...v,
            currentLocation: {
              latitude: v.currentLocation.latitude + (Math.random() - 0.5) * 0.002,
              longitude: v.currentLocation.longitude + (Math.random() - 0.5) * 0.003,
            },
            updatedAt: new Date().toISOString(),
          };
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const addVehicle = useCallback(async (v: Vehicle) => {
    const created = await fetchJson("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    setVehicles((prev) => [...prev, created]);
  }, []);

  const updateVehicle = useCallback(async (id: string, data: Partial<Vehicle>) => {
    await fetchJson(`/api/vehicles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...data, updatedAt: new Date().toISOString() } : v))
    );
  }, []);

  const deleteVehicle = useCallback(async (id: string) => {
    await fetchJson(`/api/vehicles/${id}`, { method: "DELETE" });
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const addDriver = useCallback(async (d: Driver) => {
    const created = await fetchJson("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    setDrivers((prev) => [...prev, created]);
  }, []);

  const updateDriver = useCallback(async (id: string, data: Partial<Driver>) => {
    await fetchJson(`/api/drivers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setDrivers((prev) =>
      prev.map((dr) => (dr.id === id ? { ...dr, ...data, updatedAt: new Date().toISOString() } : dr))
    );
  }, []);

  const deleteDriver = useCallback(async (id: string) => {
    await fetchJson(`/api/drivers/${id}`, { method: "DELETE" });
    setDrivers((prev) => prev.filter((dr) => dr.id !== id));
  }, []);

  const clockIn = useCallback(async (driverId: string) => {
    const now = new Date().toISOString();
    await fetchJson(`/api/drivers/${driverId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clockedIn: true, clockedInAt: now, clockedOutAt: null }),
    });
    setDrivers((prev) =>
      prev.map((dr) =>
        dr.id === driverId
          ? { ...dr, clockedIn: true, clockedInAt: now, clockedOutAt: undefined, updatedAt: now }
          : dr
      )
    );
  }, []);

  const clockOut = useCallback(async (driverId: string) => {
    const now = new Date().toISOString();
    await fetchJson(`/api/drivers/${driverId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clockedIn: false, clockedOutAt: now }),
    });
    setDrivers((prev) =>
      prev.map((dr) =>
        dr.id === driverId
          ? { ...dr, clockedIn: false, clockedOutAt: now, updatedAt: now }
          : dr
      )
    );
  }, []);

  const addDelivery = useCallback(async (d: Delivery) => {
    const payload = { ...d, createdAt: d.createdAt ?? new Date().toISOString() };
    const created = await fetchJson("/api/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setDeliveries((prev) => [...prev, created]);
  }, []);

  const updateDelivery = useCallback(async (id: string, data: Partial<Delivery>) => {
    await fetchJson(`/api/deliveries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setDeliveries((prev) =>
      prev.map((dlv) => (dlv.id === id ? { ...dlv, ...data, updatedAt: new Date().toISOString() } : dlv))
    );
  }, []);

  const deleteDelivery = useCallback(async (id: string) => {
    await fetchJson(`/api/deliveries/${id}`, { method: "DELETE" });
    setDeliveries((prev) => prev.filter((dlv) => dlv.id !== id));
  }, []);

  const setHomeLocation = useCallback(async (address: Address) => {
    const updated = await fetchJson("/api/fleet-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeLocation: address }),
    });
    setFleetSettings(updated);
  }, []);

  return (
    <FleetContext.Provider
      value={{
        vehicles,
        drivers,
        deliveries,
        fleetSettings,
        loading,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addDriver,
        updateDriver,
        deleteDriver,
        clockIn,
        clockOut,
        addDelivery,
        updateDelivery,
        deleteDelivery,
        setHomeLocation,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleetStore() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error("useFleetStore must be used within FleetProvider");
  return ctx;
}
