import React from "react";

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export function LoadingState({
  message = "Loading financial intelligence...",
  subtext = "Fetching data and running engine analysis",
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
      <div className="relative flex items-center justify-center w-12 h-12">
        <div className="absolute w-12 h-12 rounded-full border-2 border-blue-500/20 animate-ping" />
        <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
      <h4 className="text-sm font-bold text-slate-800">{message}</h4>
      <p className="text-xs text-slate-500 max-w-sm">{subtext}</p>
    </div>
  );
}
