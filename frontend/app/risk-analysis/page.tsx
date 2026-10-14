"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  Info,
  Building2,
  ChevronRight,
  UploadCloud,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { ChartCard } from "@/components/ChartCard";
import { RiskBadge } from "@/components/RiskBadge";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { useCompany } from "@/lib/CompanyContext";
import { getCompanyAnalysis, CompanyAnalysisResponse } from "@/lib/api";

const RISK_COLORS: Record<string, string> = {
  "Low Risk": "#10b981",
  "Medium Risk": "#f59e0b",
  "High Risk": "#ef4444",
};

export default function RiskAnalysisPage() {
  const { companyId } = useCompany();
  const [data, setData] = useState<CompanyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
          setError(err.message || "Failed to load company analysis.");
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
          message="Analyzing financial risk profile..."
          subtext={`Connecting to Django REST API and running ML risk model for ${companyId}`}
        />
      </DashboardLayout>
    );
  }

  if (error || !data) {
    const isNoRecords =
      error?.toLowerCase().includes("no financial records") ||
      error?.toLowerCase().includes("not found");

    if (isNoRecords) {
      return (
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Financial Risk Intelligence &amp; Rule Engine
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                    {companyId}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Workspace isolated for {companyId}. No financial statements uploaded yet.
                </p>
              </div>
            </div>

            <EmptyState
              title={`No Financial Statements Found for ${companyId}`}
              description="Upload your company's quarterly statements CSV to execute Random Forest ML risk classification, Forward Chaining risk detection, and Backward Chaining explanations."
              action={
                <Link
                  href="/csv-upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Statement CSV</span>
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
          message={error || "Failed to load risk analysis data."}
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

  const pieData = Object.entries(data.risk_probabilities || {}).map(
    ([name, probability]) => ({
      name,
      probability: Number(probability.toFixed(2)),
      color: RISK_COLORS[name] || "#64748b",
    })
  );

  const quarterlyHistory = (data.quarterly_trends || []).map((q) => ({
    quarter: q.quarter,
    predictedRisk: q.predicted_risk,
    revenue: q.revenue,
    cash: q.cash,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Financial Risk Intelligence &amp; Rule Chaining
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                  {data.company_id}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Random Forest risk prediction &amp; expert rule engine telemetry for quarter {data.latest_quarter}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">ML Classified Status:</span>
            <RiskBadge level={data.predicted_risk} size="lg" />
          </div>
        </div>

        {/* Top Risk Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ML Risk Status */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Model Classification
              </span>
              <ShieldAlert className="w-4 h-4 text-blue-600" />
            </div>
            <div className="my-4">
              <span className="text-3xl font-extrabold text-slate-900 block font-mono">
                {data.predicted_risk}
              </span>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Latest Quarter: {data.latest_quarter}
              </p>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Random Forest ML Risk Model v1.0</span>
            </div>
          </div>

          {/* ML Probability Distribution */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
              ML Probability Distribution
            </span>
            <div className="h-36 flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="probability"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#ffffff",
                      }}
                      formatter={(value: any) => [`${value}%`, "Probability"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400">Not available yet</span>
              )}
            </div>
            <div className="flex items-center justify-around text-xs pt-2 border-t border-slate-100">
              {pieData.map((p, i) => (
                <div key={i} className="text-center">
                  <span className="text-[10px] text-slate-500 block font-medium">{p.name}</span>
                  <span className="font-bold text-slate-900 text-xs font-mono">{p.probability}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rule Engine Telemetry */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Rule Engine Status
            </span>
            <div className="my-3 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Rules in Engine</span>
                <span className="font-mono text-slate-900 font-bold">10 Rules</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Active Risk Triggers</span>
                <span className="font-mono font-bold text-amber-600">
                  {data.rule_based_risks.length} Detected
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">Backward Reasoning</span>
                <span className="font-mono font-bold text-emerald-600">Verified</span>
              </div>
            </div>
            <div className="p-2 rounded.xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>Forward &amp; Backward chaining active</span>
            </div>
          </div>
        </div>

        {/* Historical Progression */}
        {quarterlyHistory.length > 0 && (
          <ChartCard
            title="Historical Quarterly Revenue &amp; Cash Profile"
            subtitle={`Actual records for ${data.company_id} from Supabase (${quarterlyHistory.length} quarters)`}
            action={
              <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 font-mono">
                {quarterlyHistory[0]?.quarter} → {quarterlyHistory[quarterlyHistory.length - 1]?.quarter}
              </span>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quarterlyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (Cr)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#3b82f6" }}
                />
                <Line
                  type="monotone"
                  dataKey="cash"
                  name="Cash (Cr)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Rule-Based Risks & Backward Chaining Explanations */}
        <DashboardCard
          title="Rule Engine Findings &amp; Backward Chaining Explanations"
          subtitle={`Deterministic risk conditions evaluated against ${data.company_id} financials`}
        >
          {data.rule_based_risks.length > 0 ? (
            <div className="space-y-4">
              {data.rule_based_risks.map((item, idx) => {
                const riskSlug = item.slug || item.risk.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all space-y-3 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                          Rule Trigger
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.risk}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <RiskBadge level={item.severity || (item.risk.includes("High") ? "High Risk" : "Medium Risk")} size="sm" />
                        <Link
                          href={`/risk-analysis/details?risk=${riskSlug}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-xs group-hover:bg-blue-50 group-hover:border-blue-200 transition-all"
                        >
                          <span>View Details &amp; Recommendations</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Rule Name */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs">
                      <span className="font-bold text-slate-500 block text-[10px] uppercase tracking-wider mb-1">
                        Rule Evaluated:
                      </span>
                      <p className="text-slate-800 font-medium">{item.rule}</p>
                    </div>

                    {/* Backward Explanation */}
                    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
                      <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[10px] uppercase tracking-wider mb-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Backward Chaining Root-Cause Explanation:
                      </div>
                      <div className="space-y-1">
                        {item.explanation.map((exp, expIdx) => (
                          <p key={expIdx} className="text-slate-800 font-medium">
                            → {exp}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-emerald-50/50 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900">
                No Rule-Based Risks Detected
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                All 10 production financial rules (Current Ratio, Debt-to-Equity, Interest Coverage, Profitability, and Cash Flow) are within safe operating thresholds for quarter {data.latest_quarter}.
              </p>
            </div>
          )}
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
