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
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-[#121620]/60 border border-zinc-800/60">
      <div className="relative flex items-center justify-center w-12 h-12 mb-4">
        <div className="absolute w-12 h-12 rounded-full border-2 border-orange-500/20 animate-ping" />
        <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
      <h4 className="text-sm font-medium text-zinc-200">{message}</h4>
      <p className="text-xs text-zinc-400 mt-1 max-w-sm">{subtext}</p>
    </div>
  );
}
