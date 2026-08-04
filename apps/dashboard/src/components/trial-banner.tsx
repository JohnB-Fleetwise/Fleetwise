"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFleetStore } from "@/lib/store";
import { isTrialExpired, hasPaidPlan } from "@fleetwise/shared";

/**
 * Global banner shown on dashboard pages when the fleet's free trial has
 * expired and there is no active subscription. Hidden on the billing page
 * itself (that page has its own, more detailed trial banner).
 */
export default function TrialBanner() {
  const { fleetSettings, loading } = useFleetStore();
  const pathname = usePathname();

  if (loading) return null;
  if (hasPaidPlan(fleetSettings)) return null;
  if (!isTrialExpired(fleetSettings)) return null;
  // Billing page already explains the situation — don't stack banners.
  if (pathname.startsWith("/dashboard/settings/billing")) return null;

  return (
    <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <svg
          className="w-5 h-5 text-red-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm font-medium text-red-800">
          Trial expired — subscribe to continue
        </p>
      </div>
      <Link
        href="/dashboard/settings/billing"
        className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shrink-0"
      >
        Choose a plan
      </Link>
    </div>
  );
}
