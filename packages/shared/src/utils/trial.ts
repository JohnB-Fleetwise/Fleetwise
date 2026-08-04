// ─── Free trial / subscription helpers ──────────────────
import type { Plan } from "../types";

export const TRIAL_LENGTH_DAYS = 14;

/** A minimal view of the fleet's billing state (enough for the helpers below). */
export interface TrialInfo {
  trialEndsAt?: string;
  plan?: Plan | string | null;
}

function trialEnd(settings: TrialInfo | null | undefined): Date | null {
  if (!settings?.trialEndsAt) return null;
  const end = new Date(settings.trialEndsAt);
  return Number.isNaN(end.getTime()) ? null : end;
}

/**
 * True when the fleet is on a free trial (plan "none" or unset) and the trial
 * end timestamp has passed. Subscribed fleets (starter/professional) are never
 * "expired", and a fleet with no trial info yet is treated as still trialing.
 */
export function isTrialExpired(settings: TrialInfo | null | undefined): boolean {
  if (!settings) return false;
  const plan = settings.plan;
  if (plan && plan !== "none") return false;
  const end = trialEnd(settings);
  if (!end) return false;
  return end.getTime() < Date.now();
}

/** Whole days remaining in the trial (rounded up). 0 when expired or unknown-future-safe default of 14 for brand-new fleets with no row yet. */
export function getTrialDaysLeft(settings: TrialInfo | null | undefined): number {
  const end = trialEnd(settings);
  if (!end) return TRIAL_LENGTH_DAYS;
  const ms = end.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

/** Days and hours remaining, e.g. "3 days, 4 hours" — used for the live countdown. */
export function getTrialTimeLeft(settings: TrialInfo | null | undefined): {
  days: number;
  hours: number;
  minutes: number;
} {
  const end = trialEnd(settings);
  if (!end) {
    return { days: TRIAL_LENGTH_DAYS, hours: 0, minutes: 0 };
  }
  const ms = Math.max(0, end.getTime() - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
  };
}

/** Human-readable label for the current plan. */
export function getPlanLabel(plan: Plan | string | null | undefined): string {
  switch (plan) {
    case "starter":
      return "Starter";
    case "professional":
      return "Professional";
    default:
      return "Trial";
  }
}

/** True when the fleet has an active paid subscription. */
export function hasPaidPlan(settings: TrialInfo | null | undefined): boolean {
  const plan = settings?.plan;
  return plan === "starter" || plan === "professional";
}
