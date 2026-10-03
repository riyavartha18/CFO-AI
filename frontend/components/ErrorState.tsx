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
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-rose-950/10 border border-rose-500/20">
      <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 mb-4">
        <AlertOctagon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-rose-300">{title}</h4>
      <p className="text-xs text-zinc-400 mt-1 max-w-md leading-relaxed">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry Analysis
          </Button>
        </div>
      )}
    </div>
  );
}
