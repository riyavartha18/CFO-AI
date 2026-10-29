"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  UploadCloud,
  ChevronRight,
  CheckCircle2,
  Building2,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { DashboardCard } from "@/components/DashboardCard";
import { ChartCard } from "@/components/ChartCard";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { useCompany } from "@/lib/CompanyContext";
import { getCompanyAnalysis, CompanyAnalysisResponse } from "@/lib/api";

export default function DashboardPage() {
  const { companyId, companyName } = useCompany();
  const [data, setData] = useState<CompanyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setData(null);

    getCompanyAnalysis(companyId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setError(err.message || "Failed to load dashboard data.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState
          message="Analyzing financial data..."
          subtext={`Connecting to Django REST API and executing ML model for ${companyId}`}
        />
      </DashboardLayout>
    );
  }

  if (error || !data) {
    const isNoRecords =
      error?.toLowerCase().includes("no financial records") ||
      error?.toLowerCase().includes("not found") ||
      error?.toLowerCase().includes("upload quarterly");

    if (isNoRecords) {
      return (
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Executive Financial Overview
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                    {companyId}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Workspace isolated for {companyName || companyId}. Ready for quarterly financial statement upload.
                </p>
              </div>
            </div>

            <EmptyState
              title={`No Financial Statements Recorded for ${companyId}`}
              description="Upload your company's quarterly statement CSV in the standardized 20-column format to generate ML risk classifications, revenue projections, cash flow forecasts, and anomaly detection."
              action={
                <Link
                  href="/csv-upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Financial Statement CSV</span>
                </Link>
              }
            />
          </div>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout>
        <ErrorState
          title="Unable to connect to Smart CFO backend"
          message={error || "Could not retrieve records from database."}
          onRetry={() => {
            setLoading(true);
            setError(null);
            getCompanyAnalysis(companyId)
              .then(setData)
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
          }}
        />
      </DashboardLayout>
    );
  }

  const fm = data.financial_metrics;
  const quarterlyTrends = data.quarterly_trends || [];
  const lowRiskProb = data.risk_probabilities?.["Low Risk"] ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Executive Financial Overview
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                  {data.company_id}
                </span>
              </h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold text-slate-600 bg-slate-100 border border-slate-200">
                Quarter: {data.latest_quarter}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real financial data retrieved from Supabase and analyzed via Random Forest ML + Rule Engine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/risk-analysis">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer">
                <span>View Risk Breakdown</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Top Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* ML Risk Card */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Current ML Risk
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-2">
              <RiskBadge level={data.predicted_risk} size="lg" />
            </div>
            <span className="text-[11px] text-slate-400">
              Confidence: {lowRiskProb.toFixed(1)}%
            </span>
          </div>

          {/* Real Revenue */}
          <MetricCard
            label="Total Revenue"
            value={fm ? `₹${fm.revenue.toFixed(1)} Cr` : "N/A"}
            subtext={`Actual for ${data.latest_quarter}`}
            icon={<DollarSign className="w-4 h-4 text-blue-600" />}
          />

          {/* Real Net Profit */}
          <MetricCard
            label="Net Profit (PAT)"
            value={fm ? `₹${fm.net_profit.toFixed(1)} Cr` : "N/A"}
            subtext={
              fm
                ? `Margin: ${((fm.net_profit / (fm.revenue || 1)) * 100).toFixed(1)}%`
                : "N/A"
            }
            isPositive={fm ? fm.net_profit >= 0 : undefined}
            icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          />

          {/* Real Cash */}
          <MetricCard
            label="Cash &amp; Equivalents"
            value={fm ? `₹${fm.cash.toFixed(1)} Cr` : "N/A"}
            subtext="Available Liquidity"
            icon={<Wallet className="w-4 h-4 text-indigo-600" />}
          />

          {/* Real Total Debt */}
          <MetricCard
            label="Total Debt"
            value={fm ? `₹${fm.total_debt.toFixed(1)} Cr` : "N/A"}
            subtext={
              fm && fm.equity
                ? `D/E: ${(fm.total_debt / fm.equity).toFixed(2)}x`
                : "Total Leverage"
            }
            icon={<CreditCard className="w-4 h-4 text-purple-600" />}
          />
        </div>

        {/* Charts Row: Real Revenue & Profit Trends */}
        {quarterlyTrends.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartCard
                title="Revenue vs. Net Profit Performance"
                subtitle={`Historical progression for ${data.company_id} (₹ in Crores)`}
                action={
                  <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 font-mono">
                    {quarterlyTrends.length} Quarters
                  </span>
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={quarterlyTrends.slice(-8)}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="quarter" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#ffffff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (Cr)"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="net_profit"
                      name="Net Profit (Cr)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#patGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Cash vs Debt Area Comparison */}
            <ChartCard
              title="Liquidity vs. Debt Position"
              subtitle="Quarterly balance sheet progression (₹ in Crores)"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={quarterlyTrends.slice(-8)}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="quarter" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#ffffff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cash"
                    name="Cash Reserves (Cr)"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fill="#0ea5e9"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_debt"
                    name="Total Debt (Cr)"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fill="#f43f5e"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Rule-Engine Insights */}
        <DashboardCard
          title="Rule Engine Findings &amp; Insights"
          subtitle={`Evaluated conditions for ${data.company_id} (${data.latest_quarter})`}
          action={
            <Link
              href="/risk-analysis"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
            >
              Deep Dive <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {data.rule_based_risks.length > 0 ? (
            <div className="space-y-3">
              {data.rule_based_risks.map((item, idx) => {
                const riskSlug = item.slug || item.risk.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                return (
                  <Link
                    key={idx}
                    href={`/risk-analysis/details?risk=${riskSlug}`}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-blue-400 hover:bg-slate-100/80 transition-all flex items-start justify-between gap-3 group block"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.risk} ({item.rule})
                        </h4>
                        <div className="space-y-0.5 mt-1">
                          {item.explanation.map((exp, expIdx) => (
                            <p key={expIdx} className="text-xs text-slate-600">
                              {exp}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                All 10 production financial rules (Current Ratio, Debt-to-Equity, Interest Coverage, Profitability, and Cash Flow) are within safe operating limits.
              </span>
            </div>
          )}
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
