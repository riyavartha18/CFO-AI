"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCompany } from "@/lib/CompanyContext";
import { AnomalyDetailModal } from "@/components/AnomalyDetailModal";
import {
  getAnomalyOverview,
  scanAnomalies,
  AnomalyOverviewResponse,
  AnomalyChartItem,
} from "@/lib/api";
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  Building2,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Filter,
  AlertCircle,
  Info,
  CheckCircle2,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Soft pastel chart palette map matching reference financial analytics design
const CHART_COLOR_PALETTE: Record<string, { stroke: string; fill: string }> = {
  revenue: { stroke: "#3B82F6", fill: "#DBEAFE" }, // Soft Blue
  cogs: { stroke: "#F97316", fill: "#FFEDD5" }, // Soft Amber
  operating_expenses: { stroke: "#8B5CF6", fill: "#EDE9FE" }, // Lavender
  total_expenses: { stroke: "#6366F1", fill: "#E0E7FF" }, // Indigo
  interest_expense: { stroke: "#EC4899", fill: "#FCE7F3" }, // Pink
  depreciation: { stroke: "#64748B", fill: "#F1F5F9" }, // Slate
  tax_expense: { stroke: "#0EA5E9", fill: "#E0F2FE" }, // Sky Blue
  operating_profit: { stroke: "#10B981", fill: "#D1FAE5" }, // Mint Green
  operating_profit_margin: { stroke: "#059669", fill: "#A7F3D0" }, // Emerald
  revenue_growth: { stroke: "#3B82F6", fill: "#DBEAFE" }, // Blue
  expense_growth: { stroke: "#F43F5E", fill: "#FFE4E6" }, // Coral Rose
  cash: { stroke: "#14B8A6", fill: "#CCFBF1" }, // Teal
  operating_cash_flow: { stroke: "#10B981", fill: "#D1FAE5" }, // Green
  investing_cash_flow: { stroke: "#8B5CF6", fill: "#EDE9FE" }, // Purple
  financing_cash_flow: { stroke: "#F59E0B", fill: "#FEF3C7" }, // Amber
  accounts_receivable: { stroke: "#0284C7", fill: "#E0F2FE" }, // Sky
  inventory: { stroke: "#D97706", fill: "#FEF3C7" }, // Gold
  accounts_payable: { stroke: "#7C3AED", fill: "#EDE9FE" }, // Violet
  short_term_debt: { stroke: "#EF4444", fill: "#FEE2E2" }, // Red
  long_term_debt: { stroke: "#B91C1C", fill: "#FEE2E2" }, // Crimson
  total_debt: { stroke: "#DC2626", fill: "#FEE2E2" }, // Dark Red
  fixed_assets: { stroke: "#475569", fill: "#F1F5F9" }, // Slate
  other_current_liabilities: { stroke: "#6B7280", fill: "#F3F4F6" }, // Grey
  other_non_current_liabilities: { stroke: "#4B5563", fill: "#E5E7EB" }, // Dark Grey
};

export default function AnomalyDetectionOverviewPage() {
  const { companyId, setCompanyId, availableCompanies } = useCompany();

  const [data, setData] = useState<AnomalyOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterQuarterCount, setFilterQuarterCount] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // In-Page Parameter Modal State
  const [modalState, setModalState] = useState<{ recordId: number; featureKey?: string } | null>(null);

  const loadData = useCallback(
    async (targetCompanyId: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAnomalyOverview(targetCompanyId);
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load anomaly detection data.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(companyId);
  }, [companyId, loadData]);

  const handleScan = async () => {
    if (scanning) return;
    setScanning(true);
    setError(null);
    try {
      const res = await scanAnomalies(companyId);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to run anomaly scan.");
    } finally {
      setScanning(false);
    }
  };

  const handleReviewToggle = (recordId: number, reviewed: boolean) => {
    if (!data) return;
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        records: prev.records.map((r) =>
          r.record_id === recordId ? { ...r, is_reviewed: reviewed } : r
        ),
      };
    });
  };

  const filterSeries = (series: any[]) => {
    if (!series) return [];
    if (filterQuarterCount === "8") return series.slice(-8);
    if (filterQuarterCount === "4") return series.slice(-4);
    return series;
  };

  const categories = [
    { id: "all", name: "All Feature Graphs" },
    { id: "Revenue & Expenses", name: "Revenue & Expenses" },
    { id: "Profitability", name: "Profitability & Growth" },
    { id: "Cash Flow & Liquidity", name: "Cash Flow & Liquidity" },
    { id: "Debt & Assets", name: "Debt & Assets" },
  ];

  const chartKeys = useMemo(() => {
    if (!data || !data.charts_data) return [];
    return Object.keys(data.charts_data).filter((key) => {
      if (activeCategory === "all") return true;
      return data.charts_data[key].category === activeCategory;
    });
  }, [data, activeCategory]);

  // Dynamic calculation for the 4 summary cards based on active quarter filter
  const activeMetricsSummary = useMemo(() => {
    if (!data || !data.charts_data) {
      return {
        total_metrics: 0,
        normal_metrics_count: 0,
        normal_metrics_percentage: 0,
        unusual_metrics_count: 0,
        unusual_metrics_percentage: 0,
        review_metrics_count: 0,
        review_metrics_percentage: 0,
      };
    }

    if (filterQuarterCount === "all" && data.metrics_summary) {
      return data.metrics_summary;
    }

    // Dynamic calculation over filtered quarters
    const total = data.metrics_summary?.total_metrics || Object.keys(data.charts_data).length;
    let normalCount = 0;
    let unusualCount = 0;
    let reviewCount = 0;

    const keys = Object.keys(data.charts_data);
    const accounted = new Set<string>();

    keys.forEach((k) => {
      accounted.add(k);
      const item = data.charts_data[k];
      const series = filterSeries(item.series);
      if (item.metric_status === "review" || !series || series.length < 2) {
        reviewCount += 1;
      } else {
        const hasUnusual = series.some((s) => s.is_parameter_unusual);
        if (hasUnusual) {
          unusualCount += 1;
        } else {
          normalCount += 1;
        }
      }
    });

    // Account for any configured metrics with insufficient/unavailable data
    if (data.metrics_summary?.metric_classifications) {
      Object.entries(data.metrics_summary.metric_classifications).forEach(([k]) => {
        if (!accounted.has(k)) {
          reviewCount += 1;
          accounted.add(k);
        }
      });
    }

    const normalPct = total > 0 ? Number(((normalCount / total) * 100).toFixed(1)) : 0;
    const unusualPct = total > 0 ? Number(((unusualCount / total) * 100).toFixed(1)) : 0;
    const reviewPct = total > 0 ? Number(((reviewCount / total) * 100).toFixed(1)) : 0;

    return {
      total_metrics: total,
      normal_metrics_count: normalCount,
      normal_metrics_percentage: normalPct,
      unusual_metrics_count: unusualCount,
      unusual_metrics_percentage: unusualPct,
      review_metrics_count: reviewCount,
      review_metrics_percentage: reviewPct,
    };
  }, [data, filterQuarterCount]);

  // Donut chart data for Financial Pattern Overview
  const donutData = useMemo(() => {
    if (!data || !data.parameter_summary) return [];
    const ps = data.parameter_summary;
    return [
      {
        name: "Normal Baseline",
        value: ps.normal_count,
        percentage: ps.normal_percentage,
        color: "#10B981", // Emerald Green
      },
      {
        name: "Unusual Trend",
        value: ps.unusual_count,
        percentage: ps.unusual_percentage,
        color: "#EF4444", // Coral Red
      },
    ];
  }, [data]);

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return <g />;

    if (payload.is_parameter_unusual) {
      return (
        <g key={`dot-${payload.quarter}`} className="cursor-pointer">
          <circle cx={cx} cy={cy} r={7} fill="#ef4444" stroke="#ffffff" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={13} fill="rgba(239, 68, 68, 0.25)" className="animate-ping" />
        </g>
      );
    }
    return (
      <circle
        key={`dot-${payload.quarter}`}
        cx={cx}
        cy={cy}
        r={3.5}
        fill="#10b981"
        stroke="#ffffff"
        strokeWidth={1.5}
      />
    );
  };

  const CustomTooltip = ({ active, payload, label, unit }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 z-50 border border-slate-700">
          <p className="font-bold flex items-center justify-between gap-4">
            <span>Quarter: {label}</span>
            {point.is_parameter_unusual ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-400/40 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" /> UNUSUAL TREND
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Normal Baseline
              </span>
            )}
          </p>
          <p className="text-blue-400 font-bold text-sm">
            {point.value !== undefined ? point.value.toLocaleString() : "N/A"}{" "}
            <span className="text-slate-300 text-xs font-normal">{unit}</span>
          </p>
          {point.is_parameter_unusual && (
            <p className="text-[10px] text-rose-300 font-medium pt-1">
              Click &apos;View More&apos; to view parameter explanation &amp; zoom controls
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      {/* Light Page Container Matching Reference Finance Dashboard Palette */}
      <div className="space-y-6 bg-[#F5F8FC] min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 text-slate-800">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Financial Anomaly Detection
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                  Isolation Forest ML
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Multivariate pattern analysis powered by live Supabase financial records &amp; scikit-learn.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Company Selector */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-600">Company:</span>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                {availableCompanies.map((c) => (
                  <option key={c} value={c} className="bg-white text-slate-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Historical Period Filter */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filterQuarterCount}
                onChange={(e) => setFilterQuarterCount(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white text-slate-900">
                  All Historical Quarters
                </option>
                <option value="8" className="bg-white text-slate-900">
                  Last 8 Quarters
                </option>
                <option value="4" className="bg-white text-slate-900">
                  Last 4 Quarters
                </option>
              </select>
            </div>

            {/* Re-Scan Button */}
            <button
              onClick={handleScan}
              disabled={scanning || loading}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
              <span>{scanning ? "Scanning Model..." : "Scan for Anomalies"}</span>
            </button>
          </div>
        </div>

        {/* Scan Metadata Indicator */}
        {data?.summary?.last_scan_time && (
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Last Scan Execution: <strong className="text-slate-700">{data.summary.last_scan_time}</strong>
              </span>
            </div>
            {data?.company_info && (
              <div>
                Industry: <strong className="text-slate-700">{data.company_info.industry}</strong> | Size:{" "}
                <strong className="text-slate-700">{data.company_info.company_size}</strong>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => loadData(companyId)} className="underline hover:text-rose-900 font-medium cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-800">Analyzing financial records with Isolation Forest ML...</p>
            <p className="text-xs text-slate-500">Retrieving quarterly rows from Supabase database tables</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && data && (
          <>
            {/* Top-Level Summary Cards: 4 Metric-Level Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Financial Metrics */}
              <div className="bg-white border border-slate-200/90 p-5 rounded-2xl space-y-1.5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    Total Financial Metrics
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                    Configured
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {activeMetricsSummary.total_metrics}{" "}
                    <span className="text-sm font-semibold text-slate-500 font-sans">Metrics</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Distinct financial metrics evaluated
                </p>
              </div>

              {/* Card 2: Normal Metrics */}
              <div className="bg-white border border-emerald-200/80 p-5 rounded-2xl space-y-1.5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Normal Metrics
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {activeMetricsSummary.normal_metrics_percentage}% Normal
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-2xl font-extrabold text-emerald-800 font-mono tracking-tight">
                    {activeMetricsSummary.normal_metrics_count}{" "}
                    <span className="text-sm font-semibold text-emerald-700 font-sans">Metrics</span>
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700/80 font-medium">
                  {activeMetricsSummary.normal_metrics_count} Metrics — {activeMetricsSummary.normal_metrics_percentage}% Normal
                </p>
              </div>

              {/* Card 3: Unusual Metrics */}
              <div className="bg-white border border-rose-200/90 p-5 rounded-2xl space-y-1.5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-rose-600 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    Unusual Metrics
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200">
                    {activeMetricsSummary.unusual_metrics_percentage}% Unusual
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-2xl font-extrabold text-rose-600 font-mono tracking-tight">
                    {activeMetricsSummary.unusual_metrics_count}{" "}
                    <span className="text-sm font-semibold text-rose-500 font-sans">Metrics</span>
                  </span>
                </div>
                <p className="text-[11px] text-rose-600/80 font-medium">
                  {activeMetricsSummary.unusual_metrics_count} Metrics — {activeMetricsSummary.unusual_metrics_percentage}% Unusual
                </p>
              </div>

              {/* Card 4: Metrics Requiring Review */}
              <div className="bg-white border border-amber-200/90 p-5 rounded-2xl space-y-1.5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-800 font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Metrics Requiring Review
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
                    {activeMetricsSummary.review_metrics_percentage}% Review
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-2xl font-extrabold text-amber-900 font-mono tracking-tight">
                    {activeMetricsSummary.review_metrics_count}{" "}
                    <span className="text-sm font-semibold text-amber-700 font-sans">Metrics</span>
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/80 font-medium">
                  {activeMetricsSummary.review_metrics_count > 0
                    ? `${activeMetricsSummary.review_metrics_count} Metrics — Insufficient historical data`
                    : "0 Metrics — All metric baselines verified"}
                </p>
              </div>
            </div>

            {/* NEW SECTION 2: Financial Pattern Overview Donut / Pie Chart */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      Financial Pattern Overview
                    </h2>
                    <p className="text-xs text-slate-500">
                      Parameter-level classification across all evaluated historical quarterly metrics
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Total Observations:{" "}
                  <strong className="text-slate-900 font-mono">
                    {data.parameter_summary.total_evaluated_parameters}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Donut Chart Visual */}
                <div className="md:col-span-5 h-52 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const p = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-0.5 border border-slate-700">
                                <p className="font-bold flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full inline-block"
                                    style={{ backgroundColor: p.color }}
                                  />
                                  {p.name}
                                </p>
                                <p className="font-mono text-slate-300">
                                  Count: <strong className="text-white">{p.value}</strong> ({p.percentage}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Badge */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      {data.parameter_summary.normal_percentage}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      Normal Rate
                    </span>
                  </div>
                </div>

                {/* Legend & Breakdown Cards */}
                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Normal Parameters Card */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Normal Parameters
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                        {data.parameter_summary.normal_percentage}%
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-2xl font-bold text-emerald-900 font-mono">
                        {data.parameter_summary.normal_count}
                      </span>
                      <span className="text-[11px] text-emerald-700">observations</span>
                    </div>

                    <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                      Parameters tracking within standard historical median and interquartile deviation bounds.
                    </p>
                  </div>

                  {/* Unusual Parameters Card */}
                  <div className="bg-rose-50/70 border border-rose-200/80 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Unusual Parameters
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono">
                        {data.parameter_summary.unusual_percentage}%
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-2xl font-bold text-rose-900 font-mono">
                        {data.parameter_summary.unusual_count}
                      </span>
                      <span className="text-[11px] text-rose-700">observations</span>
                    </div>

                    <p className="text-[11px] text-rose-800/80 leading-relaxed">
                      Parameters exhibiting statistically significant variance (&gt;1.5 IQR severity) against historical baselines.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto">
              <span className="text-xs text-slate-500 font-semibold pr-2">Filter Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Financial Feature Graphs Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Financial Feature Time-Series Graphs ({chartKeys.length} metrics)
                </h2>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Green: Normal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Coral/Red: Unusual Trend
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {chartKeys.map((key) => {
                  const chartItem: AnomalyChartItem = data.charts_data[key];
                  const filteredSeries = filterSeries(chartItem.series);

                  // Check if any quarter point is statistically unusual for THIS parameter
                  const unusualPoint = filteredSeries.find((s) => s.is_parameter_unusual);
                  const anyAnomalyPoint = filteredSeries.find((s) => s.is_anomaly);
                  const targetRecordId = unusualPoint?.record_id || anyAnomalyPoint?.record_id || filteredSeries[filteredSeries.length - 1]?.record_id;

                  const palette = CHART_COLOR_PALETTE[key] || { stroke: "#3B82F6", fill: "#DBEAFE" };

                  return (
                    <div
                      key={key}
                      className={`bg-white border p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-all shadow-sm ${
                        unusualPoint
                          ? "border-rose-300 shadow-rose-100/50"
                          : "border-slate-200/90 hover:border-slate-300"
                      }`}
                    >
                      {/* Card Header with Clear Color Status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                            {chartItem.title}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono">{chartItem.category}</span>
                        </div>
                        {unusualPoint ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Unusual Trend Detected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Normal Baseline
                          </span>
                        )}
                      </div>

                      {/* Line Chart */}
                      <div className="h-44 w-full pt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={filteredSeries} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="quarter" stroke="#64748B" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip unit={chartItem.unit} />} />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={palette.stroke}
                              strokeWidth={2}
                              dot={renderCustomDot}
                              activeDot={{ r: 6, fill: palette.stroke, stroke: "#ffffff", strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Card Footer with View More Action Triggering In-Page Modal */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 font-mono">Unit: {chartItem.unit}</span>
                        {targetRecordId ? (
                          <button
                            onClick={() =>
                              setModalState({
                                recordId: targetRecordId,
                                featureKey: key,
                              })
                            }
                            className={`flex items-center space-x-1 font-bold text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              unusualPoint
                                ? "text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                                : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                            }`}
                          >
                            <span>View More</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Standard trend</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* IN-PAGE POPUP MODAL (Parameter-Focused with Interactive Zoom) */}
        {modalState && (
          <AnomalyDetailModal
            recordId={modalState.recordId}
            featureKey={modalState.featureKey}
            onClose={() => setModalState(null)}
            onReviewToggle={handleReviewToggle}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
