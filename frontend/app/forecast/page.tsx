"use client";

import React from "react";
import { TrendingUp, Clock, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { useCompany } from "@/lib/CompanyContext";

export default function ForecastPage() {
  const { companyId } = useCompany();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Selected Company and Coming Soon Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Predictive Financial Forecasting
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {companyId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Coming Soon
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Multi-quarter forward projection for top-line revenue, net profit margins, and cash burn runway for {companyId}.
            </p>
          </div>
        </div>

        {/* Coming Soon Notice Banner */}
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block text-amber-300 mb-0.5">Feature in Active Development for {companyId}</span>
            The predictive time-series forecasting engine and forward cash runway models will be connected to the Django REST API in an upcoming phase. Interactive forecasting controls and scenario extrapolation for {companyId} are currently disabled.
          </div>
        </div>

        {/* Disabled Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-50 pointer-events-none select-none">
          <div className="p-5 rounded-xl bg-[#121620] border border-zinc-800">
            <span className="text-xs text-zinc-400">{companyId} Projected Revenue (FY27)</span>
            <div className="text-xl font-bold text-zinc-300 mt-2 font-mono">Not available yet</div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Awaiting backend forecast endpoint</span>
          </div>

          <div className="p-5 rounded-xl bg-[#121620] border border-zinc-800">
            <span className="text-xs text-zinc-400">{companyId} Projected Net Profit</span>
            <div className="text-xl font-bold text-zinc-300 mt-2 font-mono">Not available yet</div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Awaiting backend forecast endpoint</span>
          </div>

          <div className="p-5 rounded-xl bg-[#121620] border border-zinc-800">
            <span className="text-xs text-zinc-400">{companyId} Year-End Cash Projection</span>
            <div className="text-xl font-bold text-zinc-300 mt-2 font-mono">Not available yet</div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Awaiting backend forecast endpoint</span>
          </div>
        </div>

        {/* Placeholder Shell */}
        <DashboardCard
          title={`Forecasting Engine Architecture (${companyId})`}
          subtitle={`Overview of upcoming predictive financial capabilities for entity ${companyId}`}
        >
          <div className="p-8 text-center text-xs text-zinc-400 space-y-2">
            <TrendingUp className="w-8 h-8 text-amber-400/80 mx-auto mb-2" />
            <p className="font-medium text-zinc-300">
              Machine Learning Time-Series Projections for {companyId}
            </p>
            <p className="max-w-md mx-auto text-zinc-500">
              Future releases will leverage historical quarters to project revenue trajectories, operational burn rates, and margin variances with confidence intervals.
            </p>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
