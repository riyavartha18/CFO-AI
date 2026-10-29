"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  Info,
  Building2,
  Target,
  Activity,
  ArrowRight,
  Clock,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { ChartCard } from "@/components/ChartCard";
import { RiskBadge } from "@/components/RiskBadge";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useCompany } from "@/lib/CompanyContext";
import {
  getCompanyAnalysis,
  getCompanyForecast,
  CompanyAnalysisResponse,
  CompanyForecastResponse,
  RuleBasedRisk,
} from "@/lib/api";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function RiskDetailsContent() {
  const searchParams = useSearchParams();
  const riskQueryParam = searchParams.get("risk") || "";

  const { companyId } = useCompany();
  const [data, setData] = useState<CompanyAnalysisResponse | null>(null);
  const [forecastData, setForecastData] = useState<CompanyForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setData(null);

    Promise.all([
      getCompanyAnalysis(companyId),
      getCompanyForecast(companyId).catch(() => null),
    ])
      .then(([analysisRes, forecastRes]) => {
        if (isMounted) {
          setData(analysisRes);
          setForecastData(forecastRes);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setError(err.message || "Failed to load risk detail records.");
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
          message="Retrieving intelligent risk telemetry..."
          subtext={`Connecting to Smart CFO analysis engine for ${companyId}`}
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
              : "Unable to retrieve risk analysis details."
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

  // Find matching risk record from backend rule engine output
  const normalizedQuery = slugify(riskQueryParam);

  const matchedRisk: RuleBasedRisk | undefined = data.rule_based_risks.find((r) => {
    const rSlug = r.slug || slugify(r.risk);
    return rSlug === normalizedQuery || slugify(r.risk) === normalizedQuery;
  });

  // Fallback if risk parameter doesn't match a triggered rule
  const isFallbackOverview = !matchedRisk;
  
  const displayTitle = matchedRisk ? matchedRisk.risk : riskQueryParam ? `Risk Detail: ${riskQueryParam.replace(/-/g, " ")}` : "Overall Financial Risk Profile";
  const displayRule = matchedRisk ? matchedRisk.rule : "ML Risk Classification Engine";
  const displaySeverity = matchedRisk ? (matchedRisk.severity || (matchedRisk.risk.includes("High") ? "High Risk" : "Medium Risk")) : data.predicted_risk;
  const displayCategory = matchedRisk?.category || "Financial Risk Telemetry";
  const displayImpact = matchedRisk?.potential_impact || `The Random Forest ML risk model classified ${data.company_id} with an overall status of ${data.predicted_risk} based on 15 financial ratios evaluated against historical baselines.`;

  const quarterlyHistory = (data.quarterly_trends || []).map((q) => ({
    quarter: q.quarter,
    predictedRisk: q.predicted_risk,
    revenue: q.revenue,
    cash: q.cash,
    net_profit: q.net_profit,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/risk-analysis"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Risk Intelligence Overview</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono">
              Company: {data.company_id}
            </span>
            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono">
              Quarter: {data.latest_quarter}
            </span>
          </div>
        </div>

        {/* Header Title Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                {displayCategory}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight capitalize">
                {displayTitle}
              </h1>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
              <span>Rule Evaluated:</span>
              <span className="font-semibold text-slate-800">{displayRule}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Risk Severity:</span>
            <RiskBadge level={displaySeverity} size="lg" />
          </div>
        </div>

        {/* Financial Evidence & Metric Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Risk Overview */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Risk Classification
              </span>
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            </div>
            <div className="my-3">
              <span className="text-2xl font-extrabold text-slate-900 block font-mono">
                {displaySeverity}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Deterministic Rule Engine Status
              </p>
            </div>
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/80 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>Evaluated against quarter {data.latest_quarter} data</span>
            </div>
          </div>

          {/* Card 2: Actual Value vs Threshold */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Key Financial Evidence
              </span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="my-3 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">Primary Metric:</span>
                <span className="text-xs font-bold text-slate-900">{matchedRisk?.metric_name || "ML Risk Confidence"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">Actual Financial Value:</span>
                <span className="text-lg font-mono font-extrabold text-blue-700">
                  {matchedRisk?.actual_value || `${(data.risk_probabilities?.[data.predicted_risk] || 0).toFixed(1)}%`}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-slate-500">Rule Alert Boundary:</span>
                <span className="font-mono font-semibold text-rose-700">{matchedRisk?.threshold_display?.split("(")[0]?.trim() || "Production ML Model"}</span>
              </div>
              {matchedRisk?.threshold_display?.includes("Safe Benchmark:") && (
                <div className="flex justify-between items-baseline text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Suggested Industry Target:</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {matchedRisk.threshold_display.split("Safe Benchmark:")[1]?.replace(")", "")?.trim()}
                  </span>
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/80 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Directly derived from database records &amp; production rules</span>
            </div>
          </div>

          {/* Card 3: Business Impact */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Potential Business Impact
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs text-slate-700 my-2 leading-relaxed">
              {displayImpact}
            </p>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Requires proactive CFO oversight</span>
            </div>
          </div>
        </div>

        {/* Root-Cause Explanation (Backward Chaining) */}
        <DashboardCard
          title="Backward-Chaining Root Cause Explanation"
          subtitle="Deterministic reasoning tracing detected risk directly back to financial statement numbers"
        >
          {matchedRisk && matchedRisk.explanation.length > 0 ? (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Verified Root Cause Triggers:</span>
              </div>
              <div className="space-y-1.5 pl-6">
                {matchedRisk.explanation.map((exp, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-800 font-medium">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{exp}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : isFallbackOverview ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              No specific rule-based risk trigger selected. Viewing overall company financial risk telemetry for {data.company_id}. Select a specific risk card on the Risk Analysis dashboard for dedicated rule-level backward chaining.
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              No anomaly or risk threshold breach was triggered for this specific metric in quarter {data.latest_quarter}.
            </div>
          )}
        </DashboardCard>

        {/* Intelligent Actionable Recommendations */}
        <DashboardCard
          title="Intelligent Actionable Recommendations"
          subtitle="Prioritized financial action steps derived from actual metric values and safe operational thresholds"
        >
          {matchedRisk?.recommendations && matchedRisk.recommendations.length > 0 ? (
            <div className="space-y-4">
              {matchedRisk.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                        {rec.priority} Priority
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        {rec.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {rec.metric_threshold}
                    </span>
                  </div>

                  {/* Why recommended */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
                    <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block">
                      Why Recommended:
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed">{rec.reasoning}</p>
                  </div>

                  {/* Practical Next Steps */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-700 text-xs block">
                      Practical Next Steps:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {rec.next_steps.map((step, stepIdx) => (
                        <div
                          key={stepIdx}
                          className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-start gap-2"
                        >
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {stepIdx + 1}
                          </span>
                          <span className="text-slate-700 font-medium">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Measurable Monitoring Metric */}
                  {rec.monitoring_metric && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-blue-600" />
                        Suggested Target Monitoring Metric:
                      </span>
                      <span className="font-semibold text-slate-900 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {rec.monitoring_metric}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                General Financial Governance Recommendation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Maintain standard financial controls and review quarterly liquidity, debt leverage, and operating cash flow metrics to preserve financial health.
              </p>
            </div>
          )}
        </DashboardCard>

        {/* Action Plan & Suggested Monitoring Metrics */}
        {matchedRisk?.action_plan && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardCard
              title="Phased Action Plan"
              subtitle="Structured execution roadmap for finance team"
            >
              <div className="space-y-4 text-xs">
                {matchedRisk.action_plan.immediate_actions && (
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                      Immediate (30 Days)
                    </span>
                    <ul className="space-y-1.5 pl-2">
                      {matchedRisk.action_plan.immediate_actions.map((act, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {matchedRisk.action_plan.medium_term_actions && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                      Medium Term (90 Days)
                    </span>
                    <ul className="space-y-1.5 pl-2">
                      {matchedRisk.action_plan.medium_term_actions.map((act, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </DashboardCard>

            <DashboardCard
              title="Target Monitoring Metrics"
              subtitle="KPIs to track over upcoming quarters"
            >
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Track the following key financial ratios in quarterly financial statements to verify risk mitigation progress:
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(matchedRisk.monitoring_metrics || ["Current Ratio", "Debt-to-Equity", "Profit Margin"]).map((metric, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200 flex items-center gap-1.5"
                    >
                      <Target className="w-3.5 h-3.5 text-blue-600" />
                      {metric}
                    </span>
                  ))}
                </div>
              </div>
            </DashboardCard>
          </div>
        )}

        {/* Relevant Quarterly Trend Chart */}
        {quarterlyHistory.length > 0 && (
          <ChartCard
            title="Historical Quarterly Revenue & Cash Profile"
            subtitle={`Quarterly financial records for ${data.company_id} (${quarterlyHistory.length} quarters)`}
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
                <Line
                  type="monotone"
                  dataKey="net_profit"
                  name="Net Profit (Cr)"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#8b5cf6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function RiskDetailsPage() {
  return (
    <React.Suspense
      fallback={
        <DashboardLayout>
          <LoadingState
            message="Retrieving intelligent risk telemetry..."
            subtext="Connecting to Smart CFO analysis engine..."
          />
        </DashboardLayout>
      }
    >
      <RiskDetailsContent />
    </React.Suspense>
  );
}
