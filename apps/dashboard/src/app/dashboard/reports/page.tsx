"use client";

import { useFleetStore } from "@/lib/store";
import { getDriverDisplay } from "@/lib/mock-data";
import StatCard from "@/components/ui/stat-card";
import type { Vehicle, VehicleStatus } from "@fleetwise/shared";

// ─── Helpers ────────────────────────────────────────────

function formatClockIn(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Duration between two ISO timestamps, formatted as "Xh Ym" (floor to whole minutes). */
function formatDuration(fromIso: string, toIso: string): string {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

function formatMiles(miles: number): string {
  return miles.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    !Number.isNaN(d.getTime()) &&
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// ─── Badges ─────────────────────────────────────────────

function dutyBadge(clockedIn: boolean) {
  return clockedIn ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      On Duty
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Off Duty
    </span>
  );
}

const VEHICLE_STATUS_BADGE: Record<VehicleStatus, string> = {
  active: "bg-green-100 text-green-700",
  idle: "bg-gray-100 text-gray-600",
  maintenance: "bg-amber-100 text-amber-700",
  out_of_service: "bg-red-100 text-red-700",
};

function vehicleStatusBadge(status: VehicleStatus) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
        VEHICLE_STATUS_BADGE[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Table primitives ───────────────────────────────────

function TableShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Th({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <th className={`text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-gray-400 text-sm">
        {message}
      </td>
    </tr>
  );
}

// ─── Page ───────────────────────────────────────────────

export default function ReportsPage() {
  const { drivers, vehicles, deliveries } = useFleetStore();

  const activeDrivers = drivers.filter((d) => d.clockedIn).length;
  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const inMaintenance = vehicles.filter(
    (v) => v.status === "maintenance" || v.status === "out_of_service"
  ).length;
  const deliveriesToday = deliveries.filter((dlv) => isToday(dlv.createdAt)).length;
  const totalFleetMiles = deliveries.reduce((sum, dlv) => sum + (dlv.distanceMi ?? 0), 0);

  const sortedDrivers = [...drivers].sort((a, b) =>
    getDriverDisplay(a).name.localeCompare(getDriverDisplay(b).name)
  );
  const sortedVehicles = [...vehicles].sort((a, b) => a.name.localeCompare(b.name));

  const hasDeliveries = deliveries.length > 0;

  // Per-driver delivery stats
  const driverStats = sortedDrivers.map((d) => {
    const completed = deliveries.filter(
      (dlv) => dlv.driverId === d.id && dlv.status === "delivered"
    );
    const totalMiles = completed.reduce((sum, dlv) => sum + (dlv.distanceMi ?? 0), 0);
    return {
      driver: d,
      completed: completed.length,
      totalMiles,
      avgMiles: completed.length > 0 ? totalMiles / completed.length : null,
    };
  });

  // Per-vehicle delivery stats
  const vehicleStats = sortedVehicles.map((v) => {
    const owned = deliveries.filter((dlv) => dlv.vehicleId === v.id);
    const totalMiles = owned.reduce((sum, dlv) => sum + (dlv.distanceMi ?? 0), 0);
    return { vehicle: v, deliveries: owned.length, totalMiles };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports</h1>
      <p className="text-sm text-gray-500 mb-6">Live fleet analytics calculated from current vehicle, driver, and delivery data.</p>

      {/* Fleet Health Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Drivers"
          value={activeDrivers}
          subtitle="Clocked in now"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="Active Vehicles"
          value={activeVehicles}
          subtitle="On the road"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h5M8 15h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="In Maintenance"
          value={inMaintenance}
          subtitle="Maintenance or out of service"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="amber"
        />
        <StatCard
          title="Deliveries Today"
          value={deliveriesToday}
          subtitle="Created today"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          }
          color="purple"
        />
        <StatCard
          title="Total Fleet Miles"
          value={`${formatMiles(totalFleetMiles)} mi`}
          subtitle="All-time delivery distance"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="blue"
        />
      </div>

      {/* Driver Hours Summary */}
      <div className="mt-8">
        <TableShell title="Driver Hours Summary" subtitle="Clocked-in time and hours worked per driver">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <Th>Driver Name</Th>
                  <Th>Status</Th>
                  <Th>Clocked In</Th>
                  <Th>Hours Worked</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedDrivers.length === 0 ? (
                  <EmptyRow colSpan={4} message="No drivers yet" />
                ) : (
                  sortedDrivers.map((d) => {
                    const hoursWorked = d.clockedIn && d.clockedInAt
                      ? `Active — ${formatDuration(d.clockedInAt, new Date().toISOString())} since clock in`
                      : d.clockedInAt && d.clockedOutAt
                        ? formatDuration(d.clockedInAt, d.clockedOutAt)
                        : "—";
                    return (
                      <tr key={d.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {getDriverDisplay(d).name}
                        </td>
                        <td className="px-6 py-4">{dutyBadge(d.clockedIn)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatClockIn(d.clockedInAt)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{hoursWorked}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TableShell>
      </div>

      {/* Driver Delivery Performance */}
      <div className="mt-8">
        <TableShell title="Driver Delivery Performance" subtitle="Completed deliveries and mileage per driver">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <Th>Driver Name</Th>
                  <Th>Completed</Th>
                  <Th>Total Miles</Th>
                  <Th>Avg Miles</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!hasDeliveries ? (
                  <EmptyRow colSpan={4} message="No deliveries yet" />
                ) : (
                  driverStats.map(({ driver, completed, totalMiles, avgMiles }) => (
                    <tr key={driver.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {getDriverDisplay(driver).name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{completed}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatMiles(totalMiles)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {avgMiles !== null ? formatMiles(avgMiles) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableShell>
      </div>

      {/* Vehicle Utilization */}
      <div className="mt-8">
        <TableShell title="Vehicle Utilization" subtitle="Deliveries and distance per vehicle">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <Th>Vehicle Name</Th>
                  <Th>Status</Th>
                  <Th>Deliveries</Th>
                  <Th>Total Miles</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedVehicles.length === 0 ? (
                  <EmptyRow colSpan={4} message="No vehicles yet" />
                ) : !hasDeliveries ? (
                  <EmptyRow colSpan={4} message="No deliveries yet" />
                ) : (
                  vehicleStats.map(({ vehicle, deliveries: count, totalMiles }) => (
                    <tr key={vehicle.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{vehicle.name}</td>
                      <td className="px-6 py-4">{vehicleStatusBadge(vehicle.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{count}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatMiles(totalMiles)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableShell>
      </div>
    </div>
  );
}
