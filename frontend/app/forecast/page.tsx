"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Wallet,
  ArrowRight,
  Sparkles,
  BarChart3,
  Building2,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCompany } from "@/lib/CompanyContext";

export default function ForecastLandingPage() {
  const { companyId } = useCompany();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Forecast
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                  Financial Intel
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Explore financial forecasts and evaluate future business performance.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-600">Company:</span>
            <span className="text-xs font-bold text-slate-900 font-mono">{companyId}</span>
          </div>
        </div>

        {/* Feature Cards Grid - Exactly Two Cards Side-by-Side in One Row on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Revenue Forecasting */}
          <Link
            href="/forecast/revenue"
            className="group bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between space-y-6 relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

            <div className="space-y-4">
              {/* Card Illustration Banner */}
              <div className="w-full h-40 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/80 p-4 flex flex-col justify-between relative overflow-hidden group-hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs border border-blue-200 text-blue-700 text-[11px] font-bold shadow-xs">
                    <LineChart className="w-3.5 h-3.5" />
                    <span>ML Baseline + YoY Growth</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded">
                    4-Quarter Horizon
                  </span>
                </div>

                {/* Minimal Financial Visual Representation */}
                <div className="flex items-end justify-between gap-2 pt-4 px-2 z-10">
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 w-12 bg-blue-200 rounded-full" />
                    <div className="h-12 w-full bg-gradient-to-t from-blue-500/20 to-blue-500/5 rounded-lg border-t-2 border-blue-500 relative flex items-center justify-center">
                      <span className="text-[10px] font-bold text-blue-700 font-mono">Historical Baseline</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 w-16 bg-indigo-200 rounded-full" />
                    <div className="h-20 w-full bg-gradient-to-t from-indigo-500/20 to-indigo-500/5 rounded-lg border-t-2 border-indigo-600 border-dashed relative flex items-center justify-center">
                      <span className="text-[10px] font-bold text-indigo-700 font-mono">Forecast &amp; What-If</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Text Content */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center justify-between group-hover:text-blue-600 transition-colors">
                  <span>Revenue Forecasting</span>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mt-2">
                  Explore historical revenue data, forecast future revenue, and inspect the existing revenue prediction and what-if calculation workflow.
                </p>
              </div>
            </div>

            {/* Bottom Meta Badge */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Includes What-If Stress Simulator</span>
              <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
                Open Revenue Forecast <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Card 2: Cash Flow Forecasting */}
          <Link
            href="/forecast/cash-flow"
            className="group bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition-all duration-200 flex flex-col justify-between space-y-6 relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-teal-500/10 transition-colors" />

            <div className="space-y-4">
              {/* Card Illustration Banner */}
              <div className="w-full h-40 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100/80 p-4 flex flex-col justify-between relative overflow-hidden group-hover:border-teal-200 transition-colors">
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs border border-teal-200 text-teal-700 text-[11px] font-bold shadow-xs">
                    <Wallet className="w-3.5 h-3.5 text-teal-600" />
                    <span>Operating Cash Flow</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded">
                    Liquidity Trends
                  </span>
                </div>

                {/* Minimal Cash Flow Bar Chart Representation */}
                <div className="flex items-end justify-between gap-3 pt-4 px-4 z-10">
                  <div className="flex-1 bg-teal-300/60 rounded-t h-8" />
                  <div className="flex-1 bg-teal-400/80 rounded-t h-12" />
                  <div className="flex-1 bg-teal-500 rounded-t h-16" />
                  <div className="flex-1 bg-emerald-500 rounded-t h-20 border-t-2 border-emerald-400" />
                </div>
              </div>

              {/* Card Text Content */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center justify-between group-hover:text-teal-600 transition-colors">
                  <span>Cash Flow Forecasting</span>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mt-2">
                  A dedicated entry point for forecasting future operating cash flow, with historical trends and forecast results when supported by the existing backend.
                </p>
              </div>
            </div>

            {/* Bottom Meta Badge */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Historical &amp; Projections</span>
              <span className="text-teal-600 font-semibold group-hover:underline flex items-center gap-1">
                Open Cash Flow Forecast <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
