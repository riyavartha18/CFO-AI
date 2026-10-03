"use client";

import React from "react";
import {
  UploadCloud,
  Clock,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";

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

import { useCompany } from "@/lib/CompanyContext";

export default function CSVUploadPage() {
  const { companyId } = useCompany();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Financial Statement CSV Ingestion
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                Target: {companyId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Web Upload Coming Soon
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Automated 20-point CSV validation and database ingestion for company financial quarters.
            </p>
          </div>
        </div>

        {/* Coming Soon Notice Banner */}
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block text-amber-300 mb-0.5">
              Backend CSV Ingestion API in Development
            </span>
            The 20-point validation logic is fully implemented on the backend in Python (<code>backend/validate_csv.py</code>). The REST API endpoint connecting browser file uploads directly into Supabase is currently being finalized. Browser upload is disabled to prevent unvalidated ingestion.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Disabled Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <DashboardCard
              title="Upload Financial File (Preview)"
              subtitle="Drag & drop interface will activate upon Django upload API deployment"
            >
              <div className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/30 text-center opacity-60 select-none">
                <div className="p-3.5 rounded-full bg-zinc-800 text-zinc-500 mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-sm font-medium text-zinc-400">
                  Web upload disabled (Coming Soon)
                </p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Run validation locally via terminal: <code>python backend/validate_csv.py</code>
                </p>
              </div>
            </DashboardCard>

            {/* Validation Rules Checklist (Ready on Backend) */}
            <div className="rounded-xl bg-[#121620] border border-zinc-800/80 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Implemented Backend Python Validation Rules</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>20 Required Column Presence</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero Unexpected Extra Columns</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>No Null / Empty Cells</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Single Consistent Company ID</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unique Non-Duplicate Quarters</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Quarter Format Regex (^\d&#123;4&#125;Q[1-4]$)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>18 Numeric Float Validations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Non-Negative Revenue Check</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expected Columns Reference (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <DashboardCard
              title="Required CSV Schema Reference"
              subtitle="20 standardized header columns required by ML analysis engine"
            >
              <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                {REQUIRED_CSV_FIELDS.map((col, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-zinc-900/60 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 flex items-center justify-between"
                  >
                    <span>{col}</span>
                    <span className="text-[10px] text-zinc-500 font-sans">
                      {idx < 2 ? "Text" : "Float (Cr)"}
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
