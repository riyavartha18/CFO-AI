import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  change,
  isPositive,
  subtext,
  icon,
  badge,
}: MetricCardProps) {
  return (
    <div className="rounded-xl bg-[#121620] border border-zinc-800/80 p-5 hover:border-zinc-700/80 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-zinc-800/50 text-orange-400">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight text-white">
          {value}
        </span>
        {badge}
      </div>

      {(change || subtext) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={`inline-flex items-center font-medium ${
                isPositive === undefined
                  ? "text-zinc-400"
                  : isPositive
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {isPositive === undefined ? (
                <Minus className="w-3.5 h-3.5 mr-0.5" />
              ) : isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {change}
            </span>
          )}
          {subtext && <span className="text-zinc-400">{subtext}</span>}
        </div>
      )}
    </div>
  );
}
