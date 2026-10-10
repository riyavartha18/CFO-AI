"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Sparkles,
  Calendar,
  BarChart3,
  RefreshCw,
  Sliders,
  Building2,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
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
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useCompany } from "@/lib/CompanyContext";
import { getCompanyForecast, CompanyForecastResponse } from "@/lib/api";

export default function RevenueForecastPage() {
  const { companyId } = useCompany();
  const [data, setData] = useState<CompanyForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // What-If Simulation State Variables
  const [revenueShock, setRevenueShock] = useState<number>(0);
  const [expenseVariance, setExpenseVariance] = useState<number>(0);
  const [debtVariance, setDebtVariance] = useState<number>(0);

  const fetchForecast = (cid: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    getCompanyForecast(cid)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to load revenue forecast.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchForecast(companyId);
  }, [companyId]);

  // Combine historical and forecast data points for continuous chart visualization
  const chartData = useMemo(() => {
    if (!data) return [];
    const historical = data.historical || [];
    const forecast = data.forecast || [];

    const points: Array<{
      quarter: string;
      actual: number | null;
      forecast: number | null;
      simulated: number | null;
      isForecast: boolean;
    }> = [];

    // Map historical points
    historical.forEach((h, idx) => {
      const isLast = idx === historical.length - 1;
      points.push({
        quarter: h.quarter,
        actual: h.revenue,
        forecast: isLast ? h.revenue : null,
        simulated: null,
        isForecast: false,
      });
    });

    // Map forecast points with What-If adjustments applied
    forecast.forEach((f) => {
      const simulatedVal = Number((f.revenue * (1 + revenueShock / 100)).toFixed(2));
      points.push({
        quarter: f.quarter,
        actual: null,
        forecast: f.revenue,
        simulated: simulatedVal,
        isForecast: true,
      });
    });

    return points;
  }, [data, revenueShock]);

  const isDeclining = data?.trend === "Declining";
  const isIncreasing = data?.trend === "Increasing";
  const baselineRevenue = data?.latest_revenue ?? 0;
  const growthUsed = data?.capped_growth_percent ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-1">
              <Link href="/forecast" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Forecast Landing
              </Link>
              <span>/</span>
              <span className="text-blue-600 font-bold">Revenue &amp; What-If</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Revenue Forecasting &amp; What-If Stress Simulator
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                YoY + Seasonal Baseline
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              4-quarter revenue forecast projections and interactive stress scenario modeling for {companyId}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-600">Company:</span>
              <span className="text-xs font-bold text-slate-900 font-mono">{companyId}</span>
            </div>
            <button
              onClick={() => fetchForecast(companyId)}
              disabled={loading}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200/90 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <LoadingState
            message="Calculating 4-quarter revenue forecast..."
            subtext={`Executing seasonal YoY forecasting engine for company ${companyId}`}
          />
        )}

        {/* Error State */}
        {error && (
          <ErrorState
            title={`Unable to load revenue forecast for ${companyId}`}
            message={error}
            onRetry={() => fetchForecast(companyId)}
          />
        )}

        {/* Main Content */}
        {!loading && data && (
          <>
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Baseline Revenue (LTM)"
                value={`₹${baselineRevenue.toLocaleString("en-IN")} Cr`}
                subtext={`Latest quarter: ${data.latest_historical_quarter}`}
                icon={<BarChart3 className="w-4 h-4 text-blue-600" />}
              />

              <MetricCard
                label="YoY Growth Rate (Raw)"
                value={`${data.latest_yoy_growth_percent > 0 ? "+" : ""}${data.latest_yoy_growth_percent}%`}
                isPositive={data.latest_yoy_growth_percent >= 0}
                change={`${data.latest_yoy_growth_percent > 0 ? "+" : ""}${data.latest_yoy_growth_percent}%`}
                subtext="Historical YoY momentum"
                icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
              />

              <MetricCard
                label="Capped YoY Growth (Used)"
                value={`${growthUsed > 0 ? "+" : ""}${growthUsed}%`}
                isPositive={growthUsed >= 0}
                change={`${growthUsed > 0 ? "+" : ""}${growthUsed}%`}
                subtext="Bounded within [-10%, +15%]"
                icon={<Calendar className="w-4 h-4 text-indigo-600" />}
              />

              <MetricCard
                label="Forecast Trajectory"
                value={data.trend}
                badge={
                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                      isIncreasing
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isDeclining
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {data.trend}
                  </span>
                }
                subtext="4-quarter trend trajectory"
                icon={<Sparkles className="w-4 h-4 text-amber-500" />}
              />
            </div>

            {/* Line Chart & Visualizations */}
            <ChartCard
              title={`Historical & 4-Quarter Forecast Revenue Trend (${companyId})`}
              subtitle="Solid line indicates historical observations; dashed line indicates 4-quarter forward projections."
              height="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="quarter" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" Cr" />
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        const point = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                            <p className="font-bold border-b border-slate-700 pb-1">Quarter: {label}</p>
                            {point.actual !== null && (
                              <p className="text-blue-300">
                                Historical Actual: <strong className="text-white font-mono">₹{point.actual} Cr</strong>
                              </p>
                            )}
                            {point.forecast !== null && (
                              <p className="text-indigo-300">
                                Baseline Forecast: <strong className="text-white font-mono">₹{point.forecast} Cr</strong>
                              </p>
                            )}
                            {revenueShock !== 0 && point.simulated !== null && (
                              <p className="text-amber-300">
                                Simulated ({revenueShock > 0 ? `+${revenueShock}` : revenueShock}%):{" "}
                                <strong className="text-white font-mono">₹{point.simulated} Cr</strong>
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Historical Series */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Historical Revenue"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />

                  {/* Baseline Forecast Series */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Baseline Forecast"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: "#6366f1", stroke: "#ffffff", strokeWidth: 2 }}
                  />

                  {/* Simulated What-If Series */}
                  {revenueShock !== 0 && (
                    <Line
                      type="monotone"
                      dataKey="simulated"
                      name="What-If Simulation"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      strokeDasharray="3 3"
                      dot={{ r: 4, fill: "#f59e0b", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* AI Explanations Section */}
            {data.explanation && (
              <DashboardCard
                title="Forecast Assumptions &amp; Executive Explanations"
                subtitle="Methodology and automated trend driver insights"
              >
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{data.explanation}</span>
                </div>
              </DashboardCard>
            )}

            {/* WHAT-IF STRESS SIMULATOR SECTION */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      What-If Sensitivity &amp; Financial Stress Simulator
                    </h2>
                    <p className="text-xs text-slate-500">
                      Adjust macro variables to evaluate cash runway, margin compression, and debt covenant risk for {companyId}.
                    </p>
                  </div>
                </div>

                {(revenueShock !== 0 || expenseVariance !== 0 || debtVariance !== 0) && (
                  <button
                    onClick={() => {
                      setRevenueShock(0);
                      setExpenseVariance(0);
                      setDebtVariance(0);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                  >
                    Reset Controls
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Sliders Control Panel */}
                <div className="lg:col-span-5 space-y-5 bg-slate-50 border border-slate-200/90 p-5 rounded-xl">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Stress Parameters ({companyId})
                  </h3>

                  {/* Revenue Shock Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">Revenue Shock Adjustment</span>
                      <span
                        className={`font-mono font-bold ${
                          revenueShock > 0
                            ? "text-emerald-600"
                            : revenueShock < 0
                            ? "text-rose-600"
                            : "text-slate-600"
                        }`}
                      >
                        {revenueShock > 0 ? `+${revenueShock}%` : `${revenueShock}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      step="1"
                      value={revenueShock}
                      onChange={(e) => setRevenueShock(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>-30% Contraction</span>
                      <span>Baseline (0%)</span>
                      <span>+30% Expansion</span>
                    </div>
                  </div>

                  {/* Expense Variance Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">Expense Inflation Variance</span>
                      <span
                        className={`font-mono font-bold ${
                          expenseVariance > 0
                            ? "text-rose-600"
                            : expenseVariance < 0
                            ? "text-emerald-600"
                            : "text-slate-600"
                        }`}
                      >
                        {expenseVariance > 0 ? `+${expenseVariance}%` : `${expenseVariance}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      step="1"
                      value={expenseVariance}
                      onChange={(e) => setExpenseVariance(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>-20% Savings</span>
                      <span>Baseline (0%)</span>
                      <span>+20% Inflation</span>
                    </div>
                  </div>

                  {/* Debt Principal Variance Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">Debt Burden Shift</span>
                      <span
                        className={`font-mono font-bold ${
                          debtVariance > 0
                            ? "text-rose-600"
                            : debtVariance < 0
                            ? "text-emerald-600"
                            : "text-slate-600"
                        }`}
                      >
                        {debtVariance > 0 ? `+${debtVariance}%` : `${debtVariance}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      step="1"
                      value={debtVariance}
                      onChange={(e) => setDebtVariance(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>-20% Paydown</span>
                      <span>Baseline (0%)</span>
                      <span>+20% Debt Takeon</span>
                    </div>
                  </div>
                </div>

                {/* Scenario Comparison Output Panel */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Simulated Output Comparison
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Simulated Baseline Metric Output */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                      <span className="text-xs text-slate-500 font-semibold block">Simulated LTM Revenue</span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-extrabold text-slate-900 font-mono">
                          ₹{Number((baselineRevenue * (1 + revenueShock / 100)).toFixed(1)).toLocaleString("en-IN")} Cr
                        </span>
                        {revenueShock !== 0 && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-bold ${
                              revenueShock > 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {revenueShock > 0 ? `+${revenueShock}%` : `${revenueShock}%`}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Baseline: ₹{baselineRevenue.toLocaleString("en-IN")} Cr
                      </p>
                    </div>

                    {/* Covenant Risk Status Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                      <span className="text-xs text-slate-500 font-semibold block">Debt Covenant Stress Assessment</span>
                      <div className="flex items-baseline justify-between pt-1">
                        <span
                          className={`text-base font-bold flex items-center gap-1.5 ${
                            revenueShock < -15 || debtVariance > 10
                              ? "text-rose-600"
                              : revenueShock < 0 || debtVariance > 0
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {revenueShock < -15 || debtVariance > 10 ? (
                            <>
                              <AlertTriangle className="w-4 h-4 text-rose-500" /> Covenant Warning
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-4 h-4 text-emerald-600" /> Within Covenants
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {revenueShock < -15 || debtVariance > 10
                          ? "Simulated stress triggers covenant alert boundaries."
                          : "Financial ratios remain within standard covenant tolerances."}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block mb-0.5">Interactive Sensitivity Active</strong>
                      Adjusting parameters dynamically updates forecast timelines and covenant thresholds. Sensitivity modeling is computed locally based on baseline YoY momentum.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
