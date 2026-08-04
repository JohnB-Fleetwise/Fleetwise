"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "General", href: "/dashboard/settings" },
  { label: "Billing", href: "/dashboard/settings/billing" },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
      {TABS.map((tab) => {
        // "General" matches exactly; "Billing" matches its subtree.
        const active =
          tab.href === "/dashboard/settings"
            ? pathname === "/dashboard/settings"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              active
                ? "text-fleet-700 border-fleet-600"
                : "text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
