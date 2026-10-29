"use client";

import React from "react";
import { GitCompare, Clock, AlertCircle, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { useCompany } from "@/lib/CompanyContext";

export default function CompanyComparisonPage() {
  const { companyId } = useCompany();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Multi-Company Portfolio Comparison
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" /> Coming Soon
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cross-compare revenue scale, profitability, leverage, and liquidity health comparing {companyId} against peer corporate entities.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-600">Active:</span>
            <span className="text-xs font-bold text-slate-900 font-mono">{companyId}</span>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm text-xs text-slate-700 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <span className="font-bold text-slate-900 block text-sm">
              Feature in Active Development (Comparing with {companyId})
            </span>
            <p className="text-slate-500 leading-relaxed">
              The multi-company portfolio comparison API is scheduled for the next backend release. You can currently analyze <strong>{companyId}</strong> and other entities (e.g., C001, C002, ABC123) in the live Executive Overview, Anomaly Detection, and Risk Analysis pages.
            </p>
          </div>
        </div>

        {/* Disabled Preview Shell */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm opacity-60 pointer-events-none select-none space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Portfolio Benchmarking for {companyId} (Preview)
          </h3>
          <div className="p-12 text-center text-xs text-slate-500 space-y-2 bg-slate-50 rounded-xl border border-slate-200">
            <GitCompare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">
              Multi-Entity Aggregation Pipeline for {companyId}
            </p>
            <p className="max-w-md mx-auto text-slate-500">
              Comparative solvency rankings, leverage spreads, and liquidity benchmarks between {companyId} and other corporate portfolios will appear here.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
