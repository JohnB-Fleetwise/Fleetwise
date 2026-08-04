"use client";

import Link from "next/link";
import { useFleetStore } from "@/lib/store";
import {
  isTrialExpired,
  getTrialDaysLeft,
  getPlanLabel,
  hasPaidPlan,
} from "@fleetwise/shared";

/**
 * Shows the current subscription plan next to the fleet name, e.g.
 * "FleetWise • Starter" or "FleetWise • Trial · 12 days left".
 * When on a trial, the badge links to the billing page.
 */
export default function PlanBadge() {
  const { fleetSettings, loading } = useFleetStore();

  if (loading) return null;

  const plan = fleetSettings?.plan ?? "none";
  const label = getPlanLabel(plan);

  // Paid plan — static badge, no link needed.
  if (hasPaidPlan(fleetSettings)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        FleetWise • {label}
      </span>
    );
  }

  // Trial (active or expired) — badge links to billing.
  const expired = isTrialExpired(fleetSettings);
  const daysLeft = getTrialDaysLeft(fleetSettings);

  return (
    <Link
      href="/dashboard/settings/billing"
      title="Manage your plan"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
        expired
          ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          expired ? "bg-red-500" : "bg-amber-500"
        }`}
      />
      {expired
        ? "FleetWise • Trial expired"
        : `FleetWise • Trial · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
    </Link>
  );
}
