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
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
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
import { useCompany } from "@/lib/CompanyContext";
import { getCompanyAnalysis, CompanyAnalysisResponse } from "@/lib/api";

export default function DashboardPage() {
  const { companyId } = useCompany();
  const [data, setData] = useState<CompanyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setData(null); // Never display stale data from the previously selected company

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
    return (
      <DashboardLayout>
        <ErrorState
          title={
            error?.includes("not found")
              ? `Company ${companyId} Not Found`
              : "Unable to connect to Smart CFO backend."
          }
          message={error || "No financial records available for this company."}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Executive Financial Overview
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {data.company_id}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800">
                Quarter: {data.latest_quarter}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Real financial data retrieved from Supabase and analyzed via Random Forest ML + Rule Engine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/risk-analysis">
              <Button size="sm">
                View Risk Breakdown <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Real ML Risk Card */}
          <div className="rounded-xl bg-[#121620] border border-orange-500/30 p-5 shadow-[0_0_20px_rgba(249,115,22,0.08)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Current ML Risk
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-2">
              <RiskBadge level={data.predicted_risk} size="lg" />
            </div>
            <span className="text-[11px] text-zinc-400">
              Confidence: {lowRiskProb.toFixed(1)}%
            </span>
          </div>

          {/* Real Revenue */}
          <MetricCard
            label="Total Revenue"
            value={fm ? `₹${fm.revenue.toFixed(1)} Cr` : "Not available yet"}
            subtext={`Actual for ${data.latest_quarter}`}
            icon={<DollarSign className="w-4 h-4" />}
          />

          {/* Real Net Profit */}
          <MetricCard
            label="Net Profit (PAT)"
            value={fm ? `₹${fm.net_profit.toFixed(1)} Cr` : "Not available yet"}
            subtext={
              fm
                ? `Margin: ${((fm.net_profit / (fm.revenue || 1)) * 100).toFixed(1)}%`
                : "Not available yet"
            }
            isPositive={fm ? fm.net_profit >= 0 : undefined}
            icon={<TrendingUp className="w-4 h-4" />}
          />

          {/* Real Cash */}
          <MetricCard
            label="Cash & Equivalents"
            value={fm ? `₹${fm.cash.toFixed(1)} Cr` : "Not available yet"}
            subtext="Available Liquidity"
            icon={<Wallet className="w-4 h-4" />}
          />

          {/* Real Total Debt */}
          <MetricCard
            label="Total Debt"
            value={fm ? `₹${fm.total_debt.toFixed(1)} Cr` : "Not available yet"}
            subtext={
              fm && fm.equity
                ? `D/E: ${(fm.total_debt / fm.equity).toFixed(2)}x`
                : "Total Leverage"
            }
            icon={<CreditCard className="w-4 h-4" />}
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
                  <span className="text-xs text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800 font-mono">
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
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                    <XAxis dataKey="quarter" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (Cr)"
                      stroke="#f97316"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="net_profit"
                      name="Net Profit (Cr)"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#patGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Cash vs Debt Bar Comparison */}
            <ChartCard
              title="Liquidity vs. Debt Position"
              subtitle="Latest quarter balance sheet balance (₹ in Crores)"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={quarterlyTrends.slice(-8)}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                  <XAxis dataKey="quarter" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cash"
                    name="Cash Reserves (Cr)"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="#38bdf8"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_debt"
                    name="Total Debt (Cr)"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="#ef4444"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Real Rule-Engine Insights */}
        <DashboardCard
          title="Rule Engine Findings & Insights"
          subtitle={`Evaluated conditions for ${data.company_id} (${data.latest_quarter})`}
          action={
            <Link
              href="/risk-analysis"
              className="text-xs text-orange-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              Deep Dive <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {data.rule_based_risks.length > 0 ? (
            <div className="space-y-3">
              {data.rule_based_risks.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-3"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100">
                      {item.risk} ({item.rule})
                    </h4>
                    <div className="space-y-0.5 mt-1">
                      {item.explanation.map((exp, expIdx) => (
                        <p key={expIdx} className="text-xs text-zinc-400">
                          {exp}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 flex items-center gap-3 text-xs text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
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
