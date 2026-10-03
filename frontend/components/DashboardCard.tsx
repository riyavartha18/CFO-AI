import React from "react";

interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function DashboardCard({
  title,
  subtitle,
  action,
  children,
  className = "",
  glow = false,
}: DashboardCardProps) {
  return (
    <div
      className={`relative rounded-xl bg-[#121620]/90 border border-zinc-800/80 p-5 backdrop-blur-sm transition-all duration-200 ${
        glow ? "shadow-[0_0_25px_rgba(249,115,22,0.08)] border-orange-500/20" : ""
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between mb-4 pb-2 border-b border-zinc-800/50">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="ml-4">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
