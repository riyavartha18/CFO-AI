import React from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  height?: string;
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  height = "h-72",
}: ChartCardProps) {
  return (
    <div className="rounded-xl bg-[#121620] border border-zinc-800/80 p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className={`w-full ${height} flex items-center justify-center`}>
        {children}
      </div>
    </div>
  );
}
