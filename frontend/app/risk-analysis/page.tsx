"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  Info,
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
          message="Analyzing financial data..."
          subtext={`Connecting to Django REST API and running ML risk model for ${companyId}`}
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
              : "Backend Unavailable"
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

  // Format real ML probabilities for PieChart
  const pieData = Object.entries(data.risk_probabilities || {}).map(
    ([name, probability]) => ({
      name,
      probability: Number(probability.toFixed(2)),
      color: RISK_COLORS[name] || "#71717a",
    })
  );

  // Format historical quarterly trend records from real database
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Financial Risk Intelligence & Rule Chaining
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {data.company_id}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Live Random Forest risk prediction & expert rule engine telemetry for quarter {data.latest_quarter}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">ML Classified Status:</span>
            <RiskBadge level={data.predicted_risk} size="lg" />
          </div>
        </div>

        {/* Top Risk Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Real ML Risk Status */}
          <div className="rounded-xl bg-[#121620] border border-orange-500/30 p-5 shadow-[0_0_20px_rgba(249,115,22,0.08)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Model Classification
              </span>
              <ShieldAlert className="w-4 h-4 text-orange-400" />
            </div>
            <div className="my-4">
              <span className="text-3xl font-extrabold text-white block">
                {data.predicted_risk}
              </span>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Latest Evaluated Quarter: {data.latest_quarter}
              </p>
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Random Forest ML Risk Model v1.0</span>
            </div>
          </div>

          {/* Real ML Probability Distribution */}
          <div className="rounded-xl bg-[#121620] border border-zinc-800/80 p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1 block">
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
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: any) => [`${value}%`, "Probability"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-zinc-500">Not available yet</span>
              )}
            </div>
            <div className="flex items-center justify-around text-xs pt-2 border-t border-zinc-800/60">
              {pieData.map((p, i) => (
                <div key={i} className="text-center">
                  <span className="text-[10px] text-zinc-400 block">{p.name}</span>
                  <span className="font-bold text-white text-xs">{p.probability}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Real Rule Engine Telemetry */}
          <div className="rounded-xl bg-[#121620] border border-zinc-800/80 p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
              Rule Engine Status
            </span>
            <div className="my-3 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Total Rules in Engine</span>
                <span className="font-mono text-zinc-200">10 Rules</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Active Risk Triggers</span>
                <span className="font-mono font-bold text-orange-400">
                  {data.rule_based_risks.length} Detected
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-400">Backward Reasoning</span>
                <span className="font-mono text-emerald-400">Verified</span>
              </div>
            </div>
            <div className="p-2 rounded bg-zinc-900 text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <span>Forward & Backward chaining active</span>
            </div>
          </div>
        </div>

        {/* Historical Progression from Database */}
        {quarterlyHistory.length > 0 && (
          <ChartCard
            title="Historical Quarterly Revenue & Cash Profile"
            subtitle={`Actual records for ${data.company_id} from Supabase (${quarterlyHistory.length} quarters)`}
            action={
              <span className="text-xs text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800 font-mono">
                {quarterlyHistory[0]?.quarter} → {quarterlyHistory[quarterlyHistory.length - 1]?.quarter}
              </span>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={quarterlyHistory}
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
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (Cr)"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 2, fill: "#f97316" }}
                />
                <Line
                  type="monotone"
                  dataKey="cash"
                  name="Cash (Cr)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 2, fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Real Rule-Based Risks & Backward Chaining Explanations */}
        <DashboardCard
          title="Rule Engine Findings & Backward Chaining Explanations"
          subtitle={`Deterministic risk conditions evaluated against ${data.company_id} financials`}
        >
          {data.rule_based_risks.length > 0 ? (
            <div className="space-y-4">
              {data.rule_based_risks.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Rule Trigger
                      </span>
                      <h3 className="text-sm font-semibold text-zinc-100">
                        {item.risk}
                      </h3>
                    </div>
                    <RiskBadge level={item.risk.includes("High") ? "High Risk" : "Medium Risk"} size="sm" />
                  </div>

                  {/* Rule Name */}
                  <div className="p-3 rounded-lg bg-[#121620] border border-zinc-800/60 text-xs">
                    <span className="font-semibold text-zinc-400 block text-[10px] uppercase tracking-wider mb-1">
                      Rule Evaluated:
                    </span>
                    <p className="text-zinc-200">{item.rule}</p>
                  </div>

                  {/* Backward Explanation */}
                  <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 text-xs">
                    <div className="flex items-center gap-1.5 text-orange-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Backward Chaining Root-Cause Explanation:
                    </div>
                    <div className="space-y-1">
                      {item.explanation.map((exp, expIdx) => (
                        <p key={expIdx} className="text-zinc-200">
                          → {exp}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-zinc-900/40 border border-zinc-800/60">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-zinc-200">
                No Rule-Based Risks Detected
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                All 10 production financial rules (Current Ratio, Debt-to-Equity, Interest Coverage, Profitability, and Cash Flow) are within safe operating thresholds for quarter {data.latest_quarter}.
              </p>
            </div>
          )}
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
