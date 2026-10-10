"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Building2,
  Clock,
  ChevronLeft,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { DashboardCard } from "@/components/DashboardCard";
import { ChartCard } from "@/components/ChartCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useCompany } from "@/lib/CompanyContext";
import { getCompanyAnalysis, CompanyAnalysisResponse } from "@/lib/api";

export default function CashFlowForecastPage() {
  const { companyId } = useCompany();
  const [data, setData] = useState<CompanyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = (cid: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    getCompanyAnalysis(cid)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to load company cash flow records.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData(companyId);
  }, [companyId]);

  // Extract historical cash flow series from company quarterly trends
  const cashFlowData = (data?.quarterly_trends || []).map((q) => ({
    quarter: q.quarter,
    operating: q.operating_cash_flow ?? 0,
    cash: q.cash ?? 0,
    debt: q.total_debt ?? 0,
  }));

  const latestRecord =
    data?.quarterly_trends && data.quarterly_trends.length > 0
      ? data.quarterly_trends[data.quarterly_trends.length - 1]
      : null;
  const latestOCF = latestRecord?.operating_cash_flow ?? (data?.financial_metrics?.operating_cash_flow ?? 0);
  const latestCash = latestRecord?.cash ?? (data?.financial_metrics?.cash ?? 0);
  const latestDebt = latestRecord?.total_debt ?? (data?.financial_metrics?.total_debt ?? 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-1">
              <Link href="/forecast" className="hover:text-teal-600 flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Forecast Landing
              </Link>
              <span>/</span>
              <span className="text-teal-600 font-bold">Cash Flow Forecasting</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Cash Flow Forecasting
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold border border-teal-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-600" /> ML Engine Integration Pending
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Analyze historical operating cash flow trends and liquidity metrics for {companyId}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-semibold text-slate-600">Company:</span>
              <span className="text-xs font-bold text-slate-900 font-mono">{companyId}</span>
            </div>
            <button
              onClick={() => fetchData(companyId)}
              disabled={loading}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200/90 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Integration Status Notice Banner */}
        <div className="p-4 rounded-2xl bg-white border border-teal-200 shadow-sm text-xs text-slate-700 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <span className="font-bold text-slate-900 block text-sm">
              Cash Flow Forecast Model Status ({companyId})
            </span>
            <p className="text-slate-500 leading-relaxed">
              Historical operating cash flow, liquidity reserves, and leverage balances for <strong>{companyId}</strong> are loaded live from Supabase. The machine learning cash flow forecasting pipeline is currently under development in the Django backend and will be enabled upon endpoint release.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <LoadingState
            message="Loading historical cash flow statements..."
            subtext={`Connecting to Django REST API and retrieving Supabase records for ${companyId}`}
          />
        )}

        {/* Error State */}
        {error && (
          <ErrorState
            title={`Unable to load cash flow records for ${companyId}`}
            message={error}
            onRetry={() => fetchData(companyId)}
          />
        )}

        {/* Main Content */}
        {!loading && data && (
          <>
            {/* Cash Flow Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Latest Operating Cash Flow"
                value={`₹${latestOCF.toLocaleString("en-IN")} Cr`}
                isPositive={latestOCF >= 0}
                subtext={`Quarter: ${latestRecord?.quarter || data.latest_quarter}`}
                icon={<Wallet className="w-4 h-4 text-teal-600" />}
              />

              <MetricCard
                label="Cash Reserves (Liquidity)"
                value={`₹${latestCash.toLocaleString("en-IN")} Cr`}
                isPositive={latestCash >= 0}
                subtext={`Quarter: ${latestRecord?.quarter || data.latest_quarter}`}
                icon={<BarChart3 className="w-4 h-4 text-blue-600" />}
              />

              <MetricCard
                label="Total Debt Burden"
                value={`₹${latestDebt.toLocaleString("en-IN")} Cr`}
                isPositive={latestDebt === 0}
                subtext={`Quarter: ${latestRecord?.quarter || data.latest_quarter}`}
                icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
              />
            </div>

            {/* Historical Cash Flow Trend Bar Chart */}
            <ChartCard
              title={`Historical Operating Cash Flow & Cash Reserves (${companyId})`}
              subtitle="Quarterly breakdown of Operating Cash Flow vs Cash Reserves from Supabase database"
              height="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="quarter" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" Cr" />
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                            <p className="font-bold border-b border-slate-700 pb-1">Quarter: {label}</p>
                            {payload.map((entry: any, index: number) => (
                              <p key={index} style={{ color: entry.color }}>
                                {entry.name}: <strong className="text-white font-mono">₹{entry.value} Cr</strong>
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="operating" name="Operating Cash Flow (Cr)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cash" name="Cash Reserves (Cr)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Integration Roadmap Card */}
            <DashboardCard
              title="Cash Flow Forecast Integration Roadmap"
              subtitle="Planned model specifications for automated liquidity forecasting"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                  <div className="flex items-center space-x-2 text-teal-700 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Supabase Ingestion</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Live quarterly cash flow statements actively connected and accessible for all companies.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                  <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>Working Capital Model</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Receivables, payables, and inventory turnover models ready for cash conversion cycle projections.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                  <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
                    <ArrowUpRight className="w-4 h-4 text-indigo-600" />
                    <span>Forecast Pipeline</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Dedicated backend endpoint will connect to this page seamlessly upon backend deployment.
                  </p>
                </div>
              </div>
            </DashboardCard>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
