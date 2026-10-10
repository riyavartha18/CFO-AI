"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getAnomalyDetail,
  markAnomalyReviewed,
  ParameterAnomalyDetailResponse,
} from "@/lib/api";
import {
  AlertTriangle,
  X,
  CheckCircle2,
  Check,
  Building2,
  Info,
  RefreshCw,
  AlertCircle,
  Activity,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
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

interface AnomalyDetailModalProps {
  recordId: number | null;
  featureKey?: string | null;
  onClose: () => void;
  onReviewToggle?: (recordId: number, reviewed: boolean) => void;
}

export function AnomalyDetailModal({
  recordId,
  featureKey,
  onClose,
  onReviewToggle,
}: AnomalyDetailModalProps) {
  const [data, setData] = useState<ParameterAnomalyDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState<boolean>(false);
  const [reviewing, setReviewing] = useState<boolean>(false);

  // Interactive Zoom Range state: [startIndex, endIndex]
  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 0]);

  const fetchDetails = useCallback(async (id: number, key?: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await getAnomalyDetail(id, key || undefined);
      setData(res);
      setReviewed(res.is_reviewed);

      // Reset Zoom to full historical range whenever new parameter data is loaded
      if (res.historical_trend && res.historical_trend.series) {
        setZoomRange([0, res.historical_trend.series.length - 1]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load parameter anomaly details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (recordId !== null) {
      fetchDetails(recordId, featureKey || undefined);
    }
  }, [recordId, featureKey, fetchDetails]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (recordId === null) return null;

  const handleToggleReview = async () => {
    if (!data || reviewing) return;
    setReviewing(true);
    try {
      const nextState = !reviewed;
      await markAnomalyReviewed(recordId, nextState);
      setReviewed(nextState);
      if (onReviewToggle) {
        onReviewToggle(recordId, nextState);
      }
    } catch (err) {
      console.error("Failed to update review status:", err);
    } finally {
      setReviewing(false);
    }
  };

  // Zoom control handlers
  const totalSeriesLength = data?.historical_trend?.series?.length || 0;

  const handleZoomIn = () => {
    if (totalSeriesLength === 0) return;
    setZoomRange(([start, end]) => {
      if (end - start <= 2) return [start, end];
      const targetIdx = data?.historical_trend?.series?.findIndex((s) => s.quarter === data.quarter);
      const center = targetIdx !== undefined && targetIdx >= start && targetIdx <= end ? targetIdx : Math.floor((start + end) / 2);
      const step = Math.max(1, Math.floor((end - start) / 4));
      const newStart = Math.max(0, center - step);
      const newEnd = Math.min(totalSeriesLength - 1, center + step);
      return [newStart, newEnd];
    });
  };

  const handleZoomOut = () => {
    if (totalSeriesLength === 0) return;
    setZoomRange(([start, end]) => {
      const newStart = Math.max(0, start - 2);
      const newEnd = Math.min(totalSeriesLength - 1, end + 2);
      return [newStart, newEnd];
    });
  };

  const handleResetZoom = () => {
    if (totalSeriesLength === 0) return;
    setZoomRange([0, totalSeriesLength - 1]);
  };

  const handleFitData = () => {
    if (totalSeriesLength === 0 || !data) return;
    const targetIdx = data.historical_trend.series.findIndex((s) => s.quarter === data.quarter);
    if (targetIdx !== -1) {
      const start = Math.max(0, targetIdx - 3);
      const end = Math.min(totalSeriesLength - 1, targetIdx + 3);
      setZoomRange([start, end]);
    }
  };

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return <g />;
    const isTargetQuarter = data?.quarter === payload.quarter;

    if (isTargetQuarter) {
      return (
        <g key={`modal-dot-${payload.quarter}`}>
          <circle cx={cx} cy={cy} r={7} fill="#ef4444" stroke="#ffffff" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={13} fill="rgba(239, 68, 68, 0.25)" className="animate-ping" />
        </g>
      );
    }
    return (
      <circle
        key={`modal-dot-${payload.quarter}`}
        cx={cx}
        cy={cy}
        r={3.5}
        fill="#3b82f6"
        stroke="#ffffff"
        strokeWidth={1.5}
      />
    );
  };

  const param = data?.parameter;
  const isUnusual = param?.is_unusual ?? false;

  // Compute sliced visible series based on zoom range
  const visibleSeries = data?.historical_trend?.series
    ? data.historical_trend.series.slice(zoomRange[0], zoomRange[1] + 1)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isUnusual
                  ? "bg-rose-100 text-rose-600 border-rose-200"
                  : "bg-blue-100 text-blue-600 border-blue-200"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Parameter: {param?.feature_label || "Financial Parameter"}
                {data?.quarter && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold font-mono">
                    {data.quarter}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                {data?.company_info.company_name} ({data?.company_info.company_id})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {data && (
              <button
                onClick={handleToggleReview}
                disabled={reviewing}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  reviewed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {reviewed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reviewed</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mark as Reviewed</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-[#F8FAFC]">
          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Analyzing parameter data...</p>
              <p className="text-xs text-slate-500">Fetching parameter evidence and historical trend baseline</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="font-bold text-sm">{error}</span>
              </div>
              <p className="text-slate-600">Failed to load parameter anomaly detail. Please try closing and reopening the modal.</p>
            </div>
          )}

          {/* Parameter Details Content */}
          {!loading && data && param && (
            <>
              {/* Parameter Header Card */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block">Investigated Parameter</span>
                    <h3 className="text-lg font-bold text-slate-900">{param.feature_label}</h3>
                  </div>

                  <div>
                    {isUnusual ? (
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 shadow-sm">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Unusual Trend Detected
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Normal Baseline Range
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid of Key Values for Selected Parameter */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                    <span className="text-slate-500 text-[11px] block">Actual ({data.quarter})</span>
                    <span className="text-base font-bold text-blue-600 font-mono">
                      {param.actual_value.toLocaleString()} {param.unit}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                    <span className="text-slate-500 text-[11px] block">Hist. Baseline</span>
                    <span className="text-sm font-bold text-slate-700 font-mono">
                      {param.historical_median.toLocaleString()} {param.unit}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                    <span className="text-slate-500 text-[11px] block">Prev Quarter</span>
                    <span className="text-sm font-semibold text-slate-700 font-mono">
                      {param.previous_value !== null ? `${param.previous_value.toLocaleString()} ${param.unit}` : "-"}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                    <span className="text-slate-500 text-[11px] block">% Change</span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        param.percent_diff > 0
                          ? "text-rose-600"
                          : param.percent_diff < 0
                          ? "text-blue-600"
                          : "text-slate-700"
                      }`}
                    >
                      {param.percent_diff > 0 ? "+" : ""}
                      {param.percent_diff}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Specific Reason: Why is this parameter unusual? */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2.5 shadow-sm">
                <span className="text-xs font-bold text-slate-900 tracking-tight uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Why is this parameter unusual?
                </span>

                <div
                  className={`p-4 rounded-xl text-xs leading-relaxed font-medium border ${
                    isUnusual
                      ? "bg-rose-50/80 border-rose-200 text-rose-900"
                      : "bg-blue-50/80 border-blue-200 text-slate-800"
                  }`}
                >
                  {param.parameter_explanation}
                </div>
              </div>

              {/* Small Comparison Graph with Interactive Zoom & Inspection Controls */}
              {data.historical_trend && (
                <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900 tracking-tight uppercase">
                        Historical Trend Comparison &amp; Inspection
                      </span>
                    </div>

                    {/* Interactive Zoom Control Toolbar */}
                    <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-slate-700">
                      <button
                        onClick={handleZoomIn}
                        title="Zoom In"
                        className="p-1 rounded hover:bg-white hover:shadow-xs transition-all cursor-pointer text-slate-700"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleZoomOut}
                        title="Zoom Out"
                        className="p-1 rounded hover:bg-white hover:shadow-xs transition-all cursor-pointer text-slate-700"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleFitData}
                        title="Fit to Data Observation"
                        className="p-1 rounded hover:bg-white hover:shadow-xs transition-all cursor-pointer text-slate-700 flex items-center gap-1 text-[10px] font-bold px-1.5"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Fit</span>
                      </button>
                      <button
                        onClick={handleResetZoom}
                        title="Reset Zoom"
                        className="p-1 rounded hover:bg-white hover:shadow-xs transition-all cursor-pointer text-slate-700 flex items-center gap-1 text-[10px] font-bold px-1.5 border-l border-slate-300/80"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Zoom range info label */}
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>
                      Viewing Quarters:{" "}
                      <strong className="text-slate-800">
                        {visibleSeries[0]?.quarter} — {visibleSeries[visibleSeries.length - 1]?.quarter}
                      </strong>{" "}
                      ({visibleSeries.length} of {totalSeriesLength})
                    </span>
                    <span>Unit: {param.unit}</span>
                  </div>

                  {/* Interactive Recharts Line Graph */}
                  <div className="h-48 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={visibleSeries} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                        <XAxis dataKey="quarter" stroke="#64748b" tick={{ fontSize: 9 }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                        <Tooltip
                          content={({ active, payload, label }: any) => {
                            if (active && payload && payload.length) {
                              const pt = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-0.5 border border-slate-700">
                                  <p className="font-bold flex items-center justify-between gap-3">
                                    <span>Quarter: {label}</span>
                                    {pt.quarter === data.quarter && (
                                      <span className="text-[10px] text-rose-400 font-bold">★ Selected</span>
                                    )}
                                  </p>
                                  <p className="text-blue-400 font-bold">
                                    {pt.value.toLocaleString()} {param.unit}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={renderCustomDot}
                          activeDot={{ r: 6, fill: "#3b82f6" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Interpretation Note */}
              <div className="bg-slate-100/70 border border-slate-200 p-3.5 rounded-xl text-xs space-y-1 text-slate-600">
                <span className="font-semibold text-slate-800 block">Interpretation Boundary:</span>
                <p className="text-[11px] leading-relaxed">
                  Statistical comparison is measured against company historical medians across available quarters. Parameter-level flags highlight noteworthy variance for financial review without implying fraud or reporting errors.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Record ID: #{recordId} | Parameter: {param?.feature_label || "N/A"}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold transition-colors cursor-pointer"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
}
