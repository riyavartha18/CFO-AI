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
  description = "Upload quarterly financial statements or select a different company identifier to view metrics.",
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-[#121620]/60 border border-zinc-800/80 border-dashed">
      <div className="p-3.5 rounded-full bg-zinc-800/80 text-zinc-400 mb-4">
        {icon || <FolderOpen className="w-6 h-6 text-orange-400/80" />}
      </div>
      <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
      <p className="text-xs text-zinc-400 mt-1 max-w-md leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
