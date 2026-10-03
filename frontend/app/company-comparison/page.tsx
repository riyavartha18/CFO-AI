"use client";

import React from "react";
import { GitCompare, Clock, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { useCompany } from "@/lib/CompanyContext";

export default function CompanyComparisonPage() {
  const { companyId } = useCompany();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Multi-Company Portfolio Comparison
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                Active: {companyId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Coming Soon
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Cross-compare revenue scale, profitability, leverage, and liquidity health comparing {companyId} against peer corporate entities.
            </p>
          </div>
        </div>

        {/* Coming Soon Notice Banner */}
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block text-amber-300 mb-0.5">Feature in Active Development (Comparing with {companyId})</span>
            The multi-company portfolio comparison API is scheduled for the next backend release. You can currently analyze {companyId} and other entities (e.g. C001, C002, ABC123) in the live Dashboard, Risk Analysis, and Financial Analysis pages.
          </div>
        </div>

        {/* Disabled Preview Shell */}
        <div className="opacity-50 pointer-events-none select-none">
          <DashboardCard
            title={`Portfolio Benchmarking for ${companyId} (Preview)`}
            subtitle={`Side-by-side comparison of ${companyId} across chosen industry peers`}
          >
            <div className="p-12 text-center text-xs text-zinc-500 space-y-2">
              <GitCompare className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="font-medium text-zinc-300">
                Multi-Entity Aggregation Pipeline for {companyId}
              </p>
              <p className="max-w-md mx-auto text-zinc-500">
                Comparative solvency rankings, leverage spreads, and liquidity benchmarks between {companyId} and other portfolios will appear here.
              </p>
            </div>
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
