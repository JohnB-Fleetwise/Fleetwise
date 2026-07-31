"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Vehicle, Driver, Delivery } from "@fleetwise/shared";

interface FleetStore {
  vehicles: Vehicle[];
  drivers: Driver[];
  deliveries: Delivery[];
  loading: boolean;
  addVehicle: (v: Vehicle) => Promise<void>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addDriver: (d: Driver) => Promise<void>;
  updateDriver: (id: string, data: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  addDelivery: (d: Delivery) => Promise<void>;
  updateDelivery: (id: string, data: Partial<Delivery>) => Promise<void>;
  deleteDelivery: (id: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  // Fetch initial data from API
  useEffect(() => {
    async function loadData() {
      try {
        const [v, d, dlv] = await Promise.all([
          fetchJson("/api/vehicles"),
          fetchJson("/api/drivers"),
          fetchJson("/api/deliveries"),
        ]);
        setVehicles(v);
        setDrivers(d);
        setDeliveries(dlv);
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

  const addDelivery = useCallback(async (d: Delivery) => {
    const created = await fetchJson("/api/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
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

  return (
    <FleetContext.Provider
      value={{
        vehicles,
        drivers,
        deliveries,
        loading,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addDriver,
        updateDriver,
        deleteDriver,
        addDelivery,
        updateDelivery,
        deleteDelivery,
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
