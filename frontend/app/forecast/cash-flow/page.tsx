"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Building2,
  ChevronLeft,
  RefreshCw,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  Info,
  Calendar,
  Layers,
  UploadCloud,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
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
import { EmptyState } from "@/components/EmptyState";
import { useCompany } from "@/lib/CompanyContext";
import { getCompanyCashFlowForecast, CashFlowForecastResponse } from "@/lib/api";

export default function CashFlowForecastPage() {
  const { companyId } = useCompany();
  const [data, setData] = useState<CashFlowForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = (cid: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    getCompanyCashFlowForecast(cid)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to load company cash flow forecast.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData(companyId);
  }, [companyId]);

  // Combine historical actuals, backtest forecasts, and future projections into a single continuous chart series
  const chartData = React.useMemo(() => {
    if (!data) return [];

    const backtestMap = new Map<string, number>();
    if (data.backtest_evaluation) {
      data.backtest_evaluation.test_quarters.forEach((q, idx) => {
        backtestMap.set(q, data.backtest_evaluation.candidate_predictions[idx]);
      });
    }

    const historical = (data.historical || []).map((h) => ({
      quarter: h.quarter,
      actual: h.operating_cash_flow,
      backtest: backtestMap.get(h.quarter) ?? null,
      forecast: null as number | null,
    }));

    const future = (data.forecast || []).map((f, idx) => {
      // Connect last historical actual point seamlessly to first forecast point visually
      const isFirst = idx === 0;
      const lastHistoricalVal = historical.length > 0 ? historical[historical.length - 1].actual : null;
      return {
        quarter: `${f.quarter} (Proj)`,
        actual: isFirst ? lastHistoricalVal : null,
        backtest: null as number | null,
        forecast: f.forecast_operating_cash_flow,
      };
    });

    return [...historical, ...future];
  }, [data]);

  // Calculate totals and metrics
  const latestOCF = data?.latest_operating_cash_flow ?? 0;
  const nextQuarterForecast = data?.forecast && data.forecast.length > 0 ? data.forecast[0].forecast_operating_cash_flow : 0;
  const nextQuarterLabel = data?.forecast && data.forecast.length > 0 ? data.forecast[0].quarter : "N/A";
  const totalForecastOCF = (data?.forecast || []).reduce((sum, item) => sum + item.forecast_operating_cash_flow, 0);

  const backtest = data?.backtest_evaluation;
  const candMetrics = backtest?.candidate_metrics;
  const baseMetrics = backtest?.baseline_metrics;

  // Helper to format signed currency values in ₹ Crores cleanly
  const formatCurrencyCr = (val: number) => {
    const absStr = Math.abs(val).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return val < 0 ? `-₹${absStr} Cr` : `₹${absStr} Cr`;
  };

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
                <ShieldCheck className="w-3 h-3 text-teal-600" /> Additive Seasonal + Trend Model
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic 4-quarter operating cash flow projections with leakage-free out-of-sample backtesting for {companyId}.
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

        {/* Loading State */}
        {loading && (
          <LoadingState
            message="Calculating cash flow forecast & out-of-sample backtesting metrics..."
            subtext={`Fetching operating cash flow statements from Supabase for ${companyId}`}
          />
        )}

        {/* Error State or Empty Records State */}
        {error && (
          error?.toLowerCase().includes("not found") || error?.toLowerCase().includes("insufficient") || error?.toLowerCase().includes("no financial records") ? (
            <EmptyState
              title={`No Historical Cash Flow Data for ${companyId}`}
              description="Upload your company's quarterly financial statements CSV to generate 4-quarter operating cash flow projections and out-of-sample backtesting."
              action={
                <Link
                  href="/csv-upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Statement CSV</span>
                </Link>
              }
            />
          ) : (
            <ErrorState
              title={`Unable to calculate cash flow forecast for ${companyId}`}
              message={error}
              onRetry={() => fetchData(companyId)}
            />
          )
        )}

        {/* Main Content */}
        {!loading && data && (
          <>
            {/* Cash Flow Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Latest Actual Operating Cash Flow"
                value={formatCurrencyCr(latestOCF)}
                isPositive={latestOCF >= 0}
                subtext={`Quarter: ${data.latest_historical_quarter}`}
                icon={<Wallet className="w-4 h-4 text-teal-600" />}
              />

              <MetricCard
                label={`Next Quarter Forecast (${nextQuarterLabel})`}
                value={formatCurrencyCr(nextQuarterForecast)}
                isPositive={nextQuarterForecast >= 0}
                subtext="Additive Seasonal + Trend Model"
                icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
              />

              <MetricCard
                label="4-Quarter Forecast Total"
                value={formatCurrencyCr(totalForecastOCF)}
                isPositive={totalForecastOCF >= 0}
                subtext="Cumulative 4-quarter OCF projection"
                icon={<BarChart3 className="w-4 h-4 text-indigo-600" />}
              />

              <MetricCard
                label="Backtesting Error (MAE)"
                value={candMetrics?.mae !== null && candMetrics?.mae !== undefined ? `₹${candMetrics.mae.toFixed(2)} Cr` : "N/A"}
                isPositive={backtest?.model_wins ?? true}
                subtext={
                  backtest?.model_wins
                    ? `Outperforms Baseline (MAE ₹${baseMetrics?.mae?.toFixed(2)} Cr)`
                    : `Baseline MAE: ₹${baseMetrics?.mae?.toFixed(2)} Cr`
                }
                icon={<Award className="w-4 h-4 text-amber-600" />}
              />
            </div>

            {/* Combined Actual vs Forecast Chart */}
            <ChartCard
              title={`Operating Cash Flow: Historical Actuals vs Forecast (${companyId})`}
              subtitle={`Quarterly Operating Cash Flow in ₹ Crores. Evaluated via out-of-sample backtest origin ${backtest?.origin_quarter || "2025-Q4"}`}
              height="h-96"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="quarter" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" Cr" />
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                            <p className="font-bold border-b border-slate-700 pb-1">Quarter: {label}</p>
                            {payload.map((entry: any, index: number) => {
                              if (entry.value === null || entry.value === undefined) return null;
                              return (
                                <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4">
                                  <span>{entry.name}:</span>
                                  <strong className="text-white font-mono">{formatCurrencyCr(entry.value)}</strong>
                                </p>
                              );
                            })}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="actual" name="Historical Actual OCF (Cr)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="backtest"
                    name="Backtest Prediction (Cr)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: "#f59e0b" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Future Forecast (Cr)"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#3b82f6" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Model-versus-Baseline Evaluation & Backtesting Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DashboardCard
                title="Out-of-Sample Backtesting Performance"
                subtitle={`Strict leakage-free evaluation trained on first ${backtest?.training_quarters_count || 24} quarters up to ${backtest?.origin_quarter || "2025-Q4"}`}
              >
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      <span className="font-semibold text-slate-700">Test Period Evaluated:</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">
                      {backtest?.test_quarters?.join(", ")}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-600">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                        <tr>
                          <th className="px-3 py-2 rounded-l-lg">Model</th>
                          <th className="px-3 py-2 text-right">MAE (₹ Cr)</th>
                          <th className="px-3 py-2 text-right">RMSE (₹ Cr)</th>
                          <th className="px-3 py-2 text-right rounded-r-lg">WAPE (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr className={backtest?.model_wins ? "bg-teal-50/50 font-semibold" : ""}>
                          <td className="px-3 py-2.5 flex items-center gap-1.5 text-slate-900">
                            <span>Candidate (Additive Seasonal + Trend)</span>
                            {backtest?.model_wins && (
                              <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">
                                Winner
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-900">
                            ₹{candMetrics?.mae?.toFixed(2) ?? "N/A"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-900">
                            ₹{candMetrics?.rmse?.toFixed(2) ?? "N/A"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-900">
                            {candMetrics?.wape_percent !== null ? `${candMetrics?.wape_percent?.toFixed(1)}%` : "N/A"}
                          </td>
                        </tr>
                        <tr className={!backtest?.model_wins ? "bg-amber-50/50 font-semibold" : ""}>
                          <td className="px-3 py-2.5 flex items-center gap-1.5 text-slate-700">
                            <span>Baseline (Seasonal Naïve)</span>
                            {!backtest?.model_wins && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                Baseline Winner
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                            ₹{baseMetrics?.mae?.toFixed(2) ?? "N/A"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                            ₹{baseMetrics?.rmse?.toFixed(2) ?? "N/A"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                            {baseMetrics?.wape_percent !== null ? `${baseMetrics?.wape_percent?.toFixed(1)}%` : "N/A"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 text-xs text-teal-900 leading-relaxed">
                    <p className="font-semibold text-teal-950 mb-0.5">Evaluation Safeguard Summary:</p>
                    {data.explanation}
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard
                title="Model Specification & Data Integrity"
                subtitle="Methodology transparency and Supabase dataset audit"
              >
                <div className="space-y-3.5 text-xs text-slate-600">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                    <div className="flex items-center space-x-2 font-bold text-slate-900">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Additive Forecasting Formula</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed font-mono bg-white p-2 rounded border border-slate-200 mt-1">
                      Forecast(T+h) = OCF(T+h-4) + Δ_annual
                    </p>
                    <p className="text-slate-500 pt-1">
                      Where <strong>Δ_annual</strong> represents the average observed annual operating cash flow shift across prior seasonal quarters ({data.full_history_trend_delta >= 0 ? "+" : ""}{data.full_history_trend_delta} Cr).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                      <span className="text-slate-400 font-semibold text-[11px]">Total Quarters Analyzed</span>
                      <p className="text-slate-900 font-bold text-sm font-mono">
                        {data.data_quality?.historical_quarters_count || 28} Quarters
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                      <span className="text-slate-400 font-semibold text-[11px]">Negative Cash Flow Quarters</span>
                      <p className="text-slate-900 font-bold text-sm font-mono">
                        {data.data_quality?.negative_quarters_count ?? 0} Quarters
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-slate-500 text-[11px] leading-relaxed pt-1">
                    <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Operating cash flows are modeled strictly using real values without artificial positive floors or zero replacements. Negative cash flows represent net cash burn in operations and are fully preserved in forecast calculations.
                    </span>
                  </div>
                </div>
              </DashboardCard>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
