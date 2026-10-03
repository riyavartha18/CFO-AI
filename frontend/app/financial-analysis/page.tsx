"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  PieChart,
  Activity,
  ArrowUpRight,
  TrendingUp,
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
import { DashboardCard } from "@/components/DashboardCard";
import { ChartCard } from "@/components/ChartCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useCompany } from "@/lib/CompanyContext";
import { getCompanyAnalysis, CompanyAnalysisResponse } from "@/lib/api";

export default function FinancialAnalysisPage() {
  const { companyId } = useCompany();
  const [data, setData] = useState<CompanyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "income" | "balance" | "cashflow" | "ratios"
  >("income");

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
          setError(err.message || "Failed to load financial analysis.");
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
          subtext={`Retrieving Supabase statements and calculating 15 financial ratios for ${companyId}`}
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

  const fm = data.financial_metrics;
  const ratios = data.financial_ratios || {};
  const quarterlyTrends = data.quarterly_trends || [];

  // Build real Income Statement rows directly from backend calculations
  const incomeStatement = fm
    ? [
        { item: "Total Revenue", amount: `₹${fm.revenue.toFixed(2)} Cr`, pct: "100.0%" },
        { item: "Cost of Goods Sold (COGS)", amount: `₹${fm.cogs.toFixed(2)} Cr`, pct: `${((fm.cogs / (fm.revenue || 1)) * 100).toFixed(1)}%` },
        { item: "Gross Profit", amount: `₹${(fm.revenue - fm.cogs).toFixed(2)} Cr`, pct: `${(((fm.revenue - fm.cogs) / (fm.revenue || 1)) * 100).toFixed(1)}%` },
        { item: "Operating Expenses", amount: `₹${fm.operating_expenses.toFixed(2)} Cr`, pct: `${((fm.operating_expenses / (fm.revenue || 1)) * 100).toFixed(1)}%` },
        { item: "EBITDA", amount: `₹${fm.ebitda.toFixed(2)} Cr`, pct: `${((fm.ebitda / (fm.revenue || 1)) * 100).toFixed(1)}%` },
        { item: "EBIT (Operating Income)", amount: `₹${fm.ebit.toFixed(2)} Cr`, pct: `${((fm.ebit / (fm.revenue || 1)) * 100).toFixed(1)}%` },
        { item: "Interest Expense", amount: `₹${fm.interest_expense.toFixed(2)} Cr`, pct: `${((fm.interest_expense / (fm.revenue || 1)) * 100).toFixed(1)}%` },
        { item: "Tax Expense", amount: `₹${fm.tax_expense.toFixed(2)} Cr`, pct: `${((fm.tax_expense / (fm.revenue || 1)) * 100).toFixed(1)}%` },
        { item: "Net Profit (PAT)", amount: `₹${fm.net_profit.toFixed(2)} Cr`, pct: `${((fm.net_profit / (fm.revenue || 1)) * 100).toFixed(1)}%` },
      ]
    : [];

  // Build real Balance Sheet rows directly from backend calculations
  const balanceSheet = fm
    ? [
        { item: "Cash & Equivalents", amount: `₹${fm.cash.toFixed(2)} Cr`, category: "Current Assets" },
        { item: "Accounts Receivable", amount: `₹${fm.accounts_receivable.toFixed(2)} Cr`, category: "Current Assets" },
        { item: "Inventory", amount: `₹${fm.inventory.toFixed(2)} Cr`, category: "Current Assets" },
        { item: "Fixed Assets", amount: `₹${fm.fixed_assets.toFixed(2)} Cr`, category: "Non-Current Assets" },
        { item: "Total Assets", amount: `₹${fm.total_assets.toFixed(2)} Cr`, category: "Assets Total" },
        { item: "Accounts Payable", amount: `₹${fm.accounts_payable.toFixed(2)} Cr`, category: "Current Liabilities" },
        { item: "Short-Term Debt", amount: `₹${fm.short_term_debt.toFixed(2)} Cr`, category: "Current Liabilities" },
        { item: "Long-Term Debt", amount: `₹${fm.long_term_debt.toFixed(2)} Cr`, category: "Non-Current Liabilities" },
        { item: "Total Liabilities", amount: `₹${fm.total_liabilities.toFixed(2)} Cr`, category: "Liabilities Total" },
        { item: "Shareholders Equity", amount: `₹${fm.equity.toFixed(2)} Cr`, category: "Equity Total" },
      ]
    : [];

  // Real Cash Flow rows
  const cashFlow = fm
    ? [
        { item: "Operating Cash Flow", amount: `₹${fm.operating_cash_flow.toFixed(2)} Cr`, status: fm.operating_cash_flow >= 0 ? "Positive" : "Negative" },
        { item: "Investing Cash Flow", amount: `₹${fm.investing_cash_flow.toFixed(2)} Cr`, status: "Capital Movement" },
        { item: "Financing Cash Flow", amount: `₹${fm.financing_cash_flow.toFixed(2)} Cr`, status: "Capital Activity" },
      ]
    : [];

  // 15 Real Ratios computed by backend
  const ratioItems = Object.entries(ratios).map(([feature, val]) => ({
    name: feature.replace(/_/g, " ").toUpperCase(),
    value: val.toString(),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Financial Statement Analysis
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {data.company_id}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Real calculated financial metrics and 15 feature ratios for quarter {data.latest_quarter}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
              Evaluated: <strong className="text-zinc-200">{data.latest_quarter}</strong>
            </span>
          </div>
        </div>

        {/* Real Quarterly Progression Chart */}
        {quarterlyTrends.length > 0 && (
          <ChartCard
            title="Real Quarterly Financial Momentum"
            subtitle={`Historical Revenue & Cash records for ${data.company_id} from Supabase (${quarterlyTrends.length} quarters)`}
            action={
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-orange-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" /> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 ml-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Cash Flow
                </span>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyTrends.slice(-8)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Bar dataKey="revenue" name="Revenue (Cr)" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cash" name="Cash (Cr)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2 overflow-x-auto">
          {[
            { id: "income", label: "Income Statement", icon: FileSpreadsheet },
            { id: "balance", label: "Balance Sheet", icon: PieChart },
            { id: "cashflow", label: "Cash Flow Statement", icon: Activity },
            { id: "ratios", label: `15 Financial Ratios (${ratioItems.length})`, icon: ArrowUpRight },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Real Income Statement */}
        {activeTab === "income" && (
          <DashboardCard
            title="Real Income Statement Breakdown"
            subtitle={`Calculated from database records for ${data.company_id} (${data.latest_quarter})`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">Financial Item</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3 px-4 font-semibold text-right">% of Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {incomeStatement.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        row.item.includes("Net Profit") || row.item === "EBITDA"
                          ? "bg-zinc-800/40 font-semibold text-orange-400"
                          : "text-zinc-300 hover:bg-zinc-900/40"
                      }
                    >
                      <td className="py-3 px-4">{row.item}</td>
                      <td className="py-3 px-4 text-right font-mono">{row.amount}</td>
                      <td className="py-3 px-4 text-right text-zinc-400">{row.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        )}

        {/* Tab 2: Real Balance Sheet */}
        {activeTab === "balance" && (
          <DashboardCard
            title="Real Balance Sheet Position"
            subtitle={`Calculated from database records for ${data.company_id} (${data.latest_quarter})`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">Classification</th>
                    <th className="py-3 px-4 font-semibold">Account Item</th>
                    <th className="py-3 px-4 font-semibold text-right">Book Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {balanceSheet.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        row.category.includes("Total")
                          ? "bg-zinc-800/50 font-bold text-white"
                          : "text-zinc-300 hover:bg-zinc-900/40"
                      }
                    >
                      <td className="py-3 px-4 text-zinc-400">{row.category}</td>
                      <td className="py-3 px-4 font-medium">{row.item}</td>
                      <td className="py-3 px-4 text-right font-mono">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        )}

        {/* Tab 3: Real Cash Flow */}
        {activeTab === "cashflow" && (
          <DashboardCard
            title="Real Cash Flow Dynamics"
            subtitle={`Calculated from database records for ${data.company_id} (${data.latest_quarter})`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {cashFlow.map((cf, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800"
                >
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
                    {cf.item}
                  </span>
                  <span className="text-xl font-bold text-white mt-2 block font-mono">
                    {cf.amount}
                  </span>
                  <span className="text-xs text-orange-400 mt-1 block">
                    {cf.status}
                  </span>
                </div>
              ))}
            </div>
          </DashboardCard>
        )}

        {/* Tab 4: Real 15 Financial Ratios */}
        {activeTab === "ratios" && (
          <DashboardCard
            title="15 Engineered Financial Ratios"
            subtitle="Real feature values computed by the backend feature engineering pipeline"
          >
            {ratioItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ratioItems.map((ratio, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800"
                  >
                    <span className="text-xs text-zinc-400 font-mono block">
                      {ratio.name}
                    </span>
                    <div className="mt-2 text-xl font-bold text-white font-mono">
                      {ratio.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-400 text-center py-6">
                Ratios not available yet for this company.
              </div>
            )}
          </DashboardCard>
        )}
      </div>
    </DashboardLayout>
  );
}
