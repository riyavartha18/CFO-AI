"use client";

import React from "react";
import {
  UploadCloud,
  Clock,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { useCompany } from "@/lib/CompanyContext";

const REQUIRED_CSV_FIELDS = [
  "company_id",
  "quarter (e.g. 2026Q1)",
  "revenue_cr",
  "cogs_cr",
  "operating_expenses_cr",
  "interest_expense_cr",
  "depreciation_cr",
  "tax_cr",
  "cash_cr",
  "accounts_receivable_cr",
  "inventory_cr",
  "fixed_assets_cr",
  "accounts_payable_cr",
  "short_term_debt_cr",
  "other_current_liabilities_cr",
  "long_term_debt_cr",
  "other_non_current_liabilities_cr",
  "operating_cash_flow_cr",
  "investing_cash_flow_cr",
  "financing_cash_flow_cr",
];

export default function CSVUploadPage() {
  const { companyId } = useCompany();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Financial Statement CSV Ingestion
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" /> Web Upload Coming Soon
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated 20-point CSV validation and database ingestion for company financial quarters.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-600">Target:</span>
            <span className="text-xs font-bold text-slate-900 font-mono">{companyId}</span>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm text-xs text-slate-700 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <span className="font-bold text-slate-900 block text-sm">
              Direct Database Connection Active for {companyId}
            </span>
            <p className="text-slate-500 leading-relaxed">
              Financial data for <strong>{companyId}</strong> is loaded directly from PostgreSQL/Supabase tables. The browser CSV upload dropzone interface is being wired to backend API endpoints. You can currently analyze {companyId}, C001, C002, and ABC123 live across all dashboard pages.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dropzone Container */}
          <div className="lg:col-span-7">
            <DashboardCard
              title="CSV Statement Upload (Preview)"
              subtitle="Drag & drop quarter statement CSV files for instant validation"
            >
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center space-y-3 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Upload Financial Statement CSV
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Supported format: .csv containing 20 financial fields in INR Crores.
                  </p>
                </div>
                <button disabled className="px-4 py-2 bg-slate-200 text-slate-500 font-semibold text-xs rounded-xl cursor-not-allowed">
                  Select CSV File (In Development)
                </button>
              </div>
            </DashboardCard>
          </div>

          {/* Schema Guide */}
          <div className="lg:col-span-5">
            <DashboardCard
              title="Required CSV Column Schema"
              subtitle="20 standard statement parameters expected by engine"
            >
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {REQUIRED_CSV_FIELDS.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200/90 text-xs font-mono font-medium text-slate-700 flex items-center justify-between"
                  >
                    <span>{field}</span>
                    <span className="text-[10px] text-emerald-700 font-sans font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Required
                    </span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
