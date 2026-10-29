import React from "react";
import { AlertOctagon } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Analysis temporarily unavailable",
  message = "Could not fetch data from the financial intelligence engine. Check connection or try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white border border-rose-200 shadow-sm space-y-3">
      <div className="p-3 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
        <AlertOctagon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-rose-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-md leading-relaxed">{message}</p>
      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-sm hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry Analysis
          </button>
        </div>
      )}
    </div>
  );
}
