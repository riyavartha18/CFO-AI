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
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold tracking-tight text-slate-900 font-mono">
          {value}
        </span>
        {badge}
      </div>

      {(change || subtext) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={`inline-flex items-center font-bold px-2 py-0.5 rounded-lg border ${
                isPositive === undefined
                  ? "bg-slate-100 text-slate-700 border-slate-200"
                  : isPositive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
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
