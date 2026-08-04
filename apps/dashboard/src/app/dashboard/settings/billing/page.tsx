"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFleetStore } from "@/lib/store";
import SettingsNav from "@/components/settings-nav";
import {
  isTrialExpired,
  getTrialTimeLeft,
  getPlanLabel,
  hasPaidPlan,
  type Plan,
} from "@fleetwise/shared";

// ─────────────────────────────────────────────────────────────
// Stripe payment links — PLACEHOLDERS. The lead replaces these
// with real Stripe payment-link URLs (create_payment_link tool).
// ─────────────────────────────────────────────────────────────
const STARTER_PAYMENT_LINK = "https://buy.stripe.com/6oU6oH8Fqfg97jre2r4wM02";
const PROFESSIONAL_PAYMENT_LINK = "https://buy.stripe.com/6oU4gz5te2tn9rz0bB4wM03";
const MANAGE_SUBSCRIPTION_LINK = "https://billing.stripe.com/p/login/placeholder";
// ─────────────────────────────────────────────────────────────

interface PlanCard {
  id: Plan;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  cta: string;
  link: string;
  highlight?: boolean;
}

const PLANS: PlanCard[] = [
  {
    id: "starter",
    name: "Starter",
    price: 12,
    tagline: "Core GPS tracking for small fleets getting started.",
    features: [
      "Core GPS tracking",
      "Driver app access",
      "Basic reports",
    ],
    cta: "Subscribe to Starter",
    link: STARTER_PAYMENT_LINK,
  },
  {
    id: "professional",
    name: "Professional",
    price: 24,
    tagline: "Everything in Starter, plus routing and maintenance.",
    features: [
      "Route optimization",
      "Maintenance reminders",
      "Advanced reports",
    ],
    cta: "Subscribe to Professional",
    link: PROFESSIONAL_PAYMENT_LINK,
    highlight: true,
  },
];

export default function BillingPage() {
  const { fleetSettings, loading } = useFleetStore();
  const [, setTick] = useState(0);

  const plan = fleetSettings?.plan ?? "none";
  const trialExpired = isTrialExpired(fleetSettings);
  const subscribed = hasPaidPlan(fleetSettings);

  // Live countdown — re-render every 30s so the clock stays current.
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const timeLeft = getTrialTimeLeft(fleetSettings);
  const countdownParts: string[] = [];
  if (timeLeft.days > 0) countdownParts.push(`${timeLeft.days} day${timeLeft.days === 1 ? "" : "s"}`);
  if (timeLeft.hours > 0 || timeLeft.days > 0) countdownParts.push(`${timeLeft.hours} hour${timeLeft.hours === 1 ? "" : "s"}`);
  countdownParts.push(`${timeLeft.minutes} min`);
  const countdown = countdownParts.join(", ");

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing &amp; Plans</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your subscription and free trial.
        </p>
      </div>

      <SettingsNav />

      {/* Trial status banner */}
      <div
        className={`rounded-xl border px-5 py-4 mb-8 flex flex-col sm:flex-row sm:items-center gap-3 ${
          trialExpired && !subscribed
            ? "bg-red-50 border-red-200"
            : "bg-blue-50 border-blue-200"
        }`}
      >
        <div className="flex items-start gap-3 flex-1">
          <svg
            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              trialExpired && !subscribed ? "text-red-600" : "text-blue-600"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {trialExpired && !subscribed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <div>
            <p
              className={`text-sm font-semibold ${
                trialExpired && !subscribed ? "text-red-800" : "text-blue-900"
              }`}
            >
              {trialExpired && !subscribed
                ? "Trial expired — subscribe to continue"
                : subscribed
                ? `You're on the ${getPlanLabel(plan)} plan`
                : `${timeLeft.days} days left in your free trial`}
            </p>
            <p
              className={`text-xs mt-0.5 ${
                trialExpired && !subscribed ? "text-red-600" : "text-blue-700"
              }`}
            >
              {trialExpired && !subscribed
                ? "Your free trial has ended. Choose a plan below to keep using FleetWise."
                : subscribed
                ? `Billed per vehicle per month. Manage your subscription any time.`
                : `Free trial ends in ${countdown}. No credit card required until then.`}
            </p>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANS.map((p) => {
          const isCurrent = plan === p.id;
          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col ${
                p.highlight ? "border-fleet-300 ring-1 ring-fleet-200" : "border-gray-200"
              }`}
            >
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">{p.name}</h2>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Current plan
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">{p.tagline}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900">
                    ${p.price}
                  </span>
                  <span className="text-sm text-gray-500">/vehicle/mo</span>
                </div>
              </div>

              <div className="px-6 py-5 flex-1">
                <ul className="space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-fleet-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-6 py-5 border-t border-gray-100">
                {isCurrent ? (
                  <Link
                    href={MANAGE_SUBSCRIPTION_LINK}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-fleet-700 bg-fleet-50 border border-fleet-200 rounded-lg hover:bg-fleet-100 transition-colors"
                  >
                    Manage subscription
                  </Link>
                ) : (
                  <a
                    href={p.link}
                    className={`w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                      p.highlight
                        ? "text-white bg-fleet-600 hover:bg-fleet-700"
                        : "text-fleet-700 bg-fleet-50 border border-fleet-200 hover:bg-fleet-100"
                    }`}
                  >
                    {p.cta}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-vehicle note */}
      <p className="mt-6 text-xs text-gray-400">
        Prices shown per vehicle per month. {subscribed ? "You can switch or cancel anytime." : "Switch or cancel anytime after subscribing."} 14-day free trial — no credit card required to start.
      </p>
    </div>
  );
}
