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
      className={`relative rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm transition-all duration-200 ${
        glow ? "shadow-md border-blue-200" : ""
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            {title && (
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="ml-4">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
