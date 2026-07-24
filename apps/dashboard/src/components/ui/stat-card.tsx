import { type ReactNode } from "react";

const COLOR_MAP: Record<string, { bg: string; text: string; iconBg: string }> =
  {
    blue: {
      bg: "bg-fleet-50",
      text: "text-fleet-700",
      iconBg: "bg-fleet-100 text-fleet-600",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-700",
      iconBg: "bg-green-100 text-green-600",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      iconBg: "bg-purple-100 text-purple-600",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      iconBg: "bg-amber-100 text-amber-600",
    },
  };

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  color?: "blue" | "green" | "purple" | "amber";
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
}: StatCardProps) {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.blue;

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <span
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors!.iconBg}`}
        >
          {icon}
        </span>
      </div>
      <div className={`text-2xl font-bold ${colors!.text}`}>{value}</div>
      <div className="mt-1 text-xs text-gray-400">{subtitle}</div>
    </div>
  );
}
