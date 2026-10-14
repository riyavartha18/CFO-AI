import React from "react";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "No financial records found",
  description = "Upload quarterly financial statements to start monitoring enterprise risk and forecasting.",
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white border border-slate-200/90 border-dashed shadow-sm">
      <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-100 shadow-2xs">
        {icon || <FolderOpen className="w-8 h-8 text-blue-600" />}
      </div>
      <h4 className="text-base font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
