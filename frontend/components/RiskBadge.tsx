import React from "react";
import { ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";

export type RiskLevel = "Low Risk" | "Medium Risk" | "High Risk" | "Low" | "Medium" | "High";

interface RiskBadgeProps {
  level: RiskLevel | string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RiskBadge({
  level,
  showIcon = true,
  size = "md",
}: RiskBadgeProps) {
  const normalized = level.toLowerCase();

  const isLow = normalized.includes("low");
  const isMedium = normalized.includes("medium") || normalized.includes("moderate");
  const isHigh = normalized.includes("high") || normalized.includes("critical");

  const colorStyles = isLow
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    : isMedium
    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
    : isHigh
    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
    : "bg-zinc-800 text-zinc-300 border-zinc-700";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5 font-medium",
    lg: "px-3.5 py-1.5 text-sm gap-2 font-medium",
  };

  const Icon = isLow ? ShieldCheck : isMedium ? AlertTriangle : AlertCircle;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${colorStyles} ${sizeStyles[size]}`}
    >
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      <span>{level}</span>
    </span>
  );
}
