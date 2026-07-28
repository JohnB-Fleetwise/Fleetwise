"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/ui/stat-card";
import type { FleetSummary } from "@fleetwise/shared";

export default function DashboardPage() {
  const [summary, setSummary] = useState<FleetSummary | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch("/api/fleet-summary");
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error("Failed to load fleet summary:", err);
      }
    }
    fetchSummary();

    // Re-fetch when tab regains focus or user navigates back
    const handleFocus = () => fetchSummary();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Vehicles"
          value={summary.totalVehicles}
          subtitle={`${summary.fleetUtilizationPercent}% utilization`}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7h8M8 11h5M8 15h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
              />
            </svg>
          }
          color="blue"
        />

        <StatCard
          title="Active Drivers"
          value={summary.activeDrivers}
          subtitle="Currently on shift"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
          color="green"
        />

        <StatCard
          title="Deliveries Today"
          value={summary.deliveriesToday}
          subtitle="On schedule"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          }
          color="purple"
        />

        <StatCard
          title="Fleet Utilization"
          value={`${summary.fleetUtilizationPercent}%`}
          subtitle={`${summary.totalDistanceKm} miles today`}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
          color="amber"
        />
      </div>

      {/* Fleet Status */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Fleet Status
          </h2>
          <div className="space-y-3">
            <StatusRow label="Total Vehicles" count={summary.totalVehicles} color="bg-blue-500" />
            <StatusRow label="Active Drivers" count={summary.activeDrivers} color="bg-green-500" />
            <StatusRow label="In Maintenance" count={summary.maintenanceAlerts} color="bg-amber-500" />
            <StatusRow label="Deliveries Today" count={summary.deliveriesToday} color="bg-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900">{count}</span>
    </div>
  );
}
