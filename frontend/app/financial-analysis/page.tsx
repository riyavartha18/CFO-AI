"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  PieChart,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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
          message="Analyzing financial statements..."
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

  const cashFlow = fm
    ? [
        { item: "Operating Cash Flow", amount: `₹${fm.operating_cash_flow.toFixed(2)} Cr`, status: fm.operating_cash_flow >= 0 ? "Positive" : "Negative" },
        { item: "Investing Cash Flow", amount: `₹${fm.investing_cash_flow.toFixed(2)} Cr`, status: "Capital Movement" },
        { item: "Financing Cash Flow", amount: `₹${fm.financing_cash_flow.toFixed(2)} Cr`, status: "Capital Activity" },
      ]
    : [];

  const ratioItems = Object.entries(ratios).map(([feature, val]) => ({
    name: feature.replace(/_/g, " ").toUpperCase(),
    value: val.toString(),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Financial Statement Analysis
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                  {data.company_id}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Calculated financial metrics and 15 feature ratios for quarter {data.latest_quarter}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/90">
              Evaluated Quarter: <strong className="text-slate-900 font-mono">{data.latest_quarter}</strong>
            </span>
          </div>
        </div>

        {/* Real Quarterly Progression Chart */}
        {quarterlyTrends.length > 0 && (
          <ChartCard
            title="Quarterly Financial Momentum"
            subtitle={`Historical Revenue & Cash records for ${data.company_id} from Supabase (${quarterlyTrends.length} quarters)`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyTrends.slice(-8)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Bar dataKey="revenue" name="Revenue (Cr)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cash" name="Cash (Cr)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
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
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Income Statement */}
        {activeTab === "income" && (
          <DashboardCard
            title="Income Statement Breakdown"
            subtitle={`Calculated from database records for ${data.company_id} (${data.latest_quarter})`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold">Financial Item</th>
                    <th className="py-3 px-4 font-bold text-right">Amount</th>
                    <th className="py-3 px-4 font-bold text-right">% of Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomeStatement.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        row.item.includes("Net Profit") || row.item === "EBITDA"
                          ? "bg-blue-50/60 font-bold text-blue-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                    >
                      <td className="py-3 px-4">{row.item}</td>
                      <td className="py-3 px-4 text-right font-mono">{row.amount}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{row.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        )}

        {/* Tab 2: Balance Sheet */}
        {activeTab === "balance" && (
          <DashboardCard
            title="Balance Sheet Position"
            subtitle={`Calculated from database records for ${data.company_id} (${data.latest_quarter})`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold">Classification</th>
                    <th className="py-3 px-4 font-bold">Account Item</th>
                    <th className="py-3 px-4 font-bold text-right">Book Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balanceSheet.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        row.category.includes("Total")
                          ? "bg-slate-100 font-bold text-slate-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                    >
                      <td className="py-3 px-4 text-slate-500 font-semibold">{row.category}</td>
                      <td className="py-3 px-4 font-medium">{row.item}</td>
                      <td className="py-3 px-4 text-right font-mono">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        )}

        {/* Tab 3: Cash Flow */}
        {activeTab === "cashflow" && (
          <DashboardCard
            title="Cash Flow Dynamics"
            subtitle={`Calculated from database records for ${data.company_id} (${data.latest_quarter})`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {cashFlow.map((cf, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/90"
                >
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {cf.item}
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 mt-2 block font-mono">
                    {cf.amount}
                  </span>
                  <span className="text-xs text-blue-600 font-semibold mt-1 block">
                    {cf.status}
                  </span>
                </div>
              ))}
            </div>
          </DashboardCard>
        )}

        {/* Tab 4: 15 Financial Ratios */}
        {activeTab === "ratios" && (
          <DashboardCard
            title="15 Engineered Financial Ratios"
            subtitle="Feature values computed by the backend feature engineering pipeline"
          >
            {ratioItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ratioItems.map((ratio, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/90"
                  >
                    <span className="text-xs text-slate-500 font-bold font-mono block">
                      {ratio.name}
                    </span>
                    <div className="mt-2 text-xl font-extrabold text-slate-900 font-mono">
                      {ratio.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-6">
                Ratios not available yet for this company.
              </div>
            )}
          </DashboardCard>
        )}
      </div>
    </DashboardLayout>
  );
}
