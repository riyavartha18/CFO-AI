"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  Download,
  Clock,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Building2,
  FileText,
  AlertTriangle,
  RefreshCw,
  X,
  ArrowRight,
  Database,
  History,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/Button";
import { useCompany } from "@/lib/CompanyContext";
import {
  getCSVTemplateDownloadUrl,
  validateFinancialCSV,
  importFinancialCSV,
  getUploadHistory,
  CSVValidationResponse,
  UploadHistoryItem,
} from "@/lib/api";

const REQUIRED_CSV_FIELDS = [
  "company_id",
  "quarter",
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
  const { companyId, companyName } = useCompany();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<CSVValidationResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = () => {
    setHistoryLoading(true);
    getUploadHistory()
      .then((res) => {
        setUploadHistory(res.history || []);
      })
      .catch(() => {
        setUploadHistory([]);
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, [companyId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setValidationError("Only standard .csv files are supported.");
      return;
    }

    setSelectedFile(file);
    setValidationError(null);
    setValidationResult(null);
    setImportSuccess(null);
    setImportError(null);
    setIsValidating(true);

    try {
      const res = await validateFinancialCSV(file);
      setValidationResult(res);
    } catch (err: unknown) {
      setValidationError(
        err instanceof Error ? err.message : "CSV validation failed. Please check schema."
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setValidationError(null);
    setImportSuccess(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const res = await importFinancialCSV(selectedFile);
      setImportSuccess(
        `Successfully ingested ${res.total_records} financial statements for ${res.company_id} (${res.inserted} inserted, ${res.updated} updated). Quarters: ${res.quarters.join(", ")}.`
      );
      handleClear();
      fetchHistory();
    } catch (err: unknown) {
      setImportError(
        err instanceof Error ? err.message : "Failed to ingest financial statements into database."
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Financial Statement Ingestion
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Multi-Company Isolated
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated 20-point quarterly CSV validation, duplicate detection, and secure Supabase database ingestion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Download Template Button */}
            <a
              href={getCSVTemplateDownloadUrl()}
              download="smart_cfo_financial_template.csv"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Download 20-Column CSV Template</span>
            </a>

            {/* Target Company Badge */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-600">Target:</span>
              <span className="text-xs font-bold text-slate-900 font-mono">{companyId}</span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {importSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm mb-0.5">Ingestion Completed!</span>
              <p className="leading-relaxed">{importSuccess}</p>
            </div>
          </div>
        )}

        {/* Global Error Alert */}
        {(validationError || importError) && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm mb-0.5">Validation / Ingestion Issue</span>
              <p className="leading-relaxed">{validationError || importError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dropzone & Preview Container */}
          <div className="lg:col-span-8 space-y-6">
            <DashboardCard
              title="Quarter Statement CSV Ingestion"
              subtitle={`All statements will be securely verified and bound to ${companyId}`}
            >
              <div className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center space-y-3 transition-colors cursor-pointer ${
                    dragActive
                      ? "border-blue-500 bg-blue-50/60"
                      : selectedFile
                      ? "border-slate-300 bg-white"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/70"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600 shadow-2xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {selectedFile ? selectedFile.name : "Choose or drag financial CSV"}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Supports 20 standard financial columns in INR Crores. Automated multi-point schema check.
                    </p>
                  </div>
                  {!selectedFile && (
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors"
                    >
                      Browse Local CSV
                    </button>
                  )}
                </div>

                {/* Selected File Card & Actions */}
                {selectedFile && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3 truncate">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 truncate block">
                          {selectedFile.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB · Ready for validation
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleClear}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Validation Loading */}
                {isValidating && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2 font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Executing 20-point validation check against Supabase database schema...</span>
                  </div>
                )}

                {/* Validation Report Details */}
                {validationResult && (
                  <div className="space-y-4 pt-2">
                    {/* Status Badge & Checkpoints */}
                    <div
                      className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                        validationResult.valid
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                          : "bg-rose-50/70 border-rose-200 text-rose-900"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {validationResult.valid ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                          )}
                          <span className="font-bold text-sm">
                            {validationResult.valid
                              ? "CSV Schema & Format Validation Passed"
                              : "CSV Format Errors Detected"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {validationResult.valid
                            ? `Found ${validationResult.row_count} quarters (${validationResult.quarters.join(", ")}). Ready to commit to ${companyId}.`
                            : "Please review the validation errors below before importing."}
                        </p>
                      </div>

                      {validationResult.valid && (
                        <Button
                          onClick={handleConfirmImport}
                          isLoading={isImporting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          Confirm &amp; Ingest to Database <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>

                    {/* Warnings (if any) */}
                    {validationResult.warnings?.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Validation Notices ({validationResult.warnings.length})</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-0.5 text-amber-800">
                          {validationResult.warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Errors (if any) */}
                    {validationResult.errors?.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Validation Failures ({validationResult.errors.length})</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-0.5 text-rose-800">
                          {validationResult.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Data Preview Table */}
                    {validationResult.preview && validationResult.preview.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Statement Records Preview (First {validationResult.preview.length} Quarters)</span>
                          <span className="text-[11px] text-slate-400 font-normal">All values in ₹ Crores</span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                              <tr>
                                <th className="px-3 py-2">Quarter</th>
                                <th className="px-3 py-2">Revenue</th>
                                <th className="px-3 py-2">COGS</th>
                                <th className="px-3 py-2">OpEx</th>
                                <th className="px-3 py-2">Cash</th>
                                <th className="px-3 py-2">Debt (ST+LT)</th>
                                <th className="px-3 py-2">Op. Cash Flow</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                              {validationResult.preview.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2 font-bold text-blue-700">{row.quarter}</td>
                                  <td className="px-3 py-2">₹{row.revenue_cr}</td>
                                  <td className="px-3 py-2">₹{row.cogs_cr}</td>
                                  <td className="px-3 py-2">₹{row.operating_expenses_cr}</td>
                                  <td className="px-3 py-2">₹{row.cash_cr}</td>
                                  <td className="px-3 py-2">
                                    ₹{(Number(row.short_term_debt_cr || 0) + Number(row.long_term_debt_cr || 0)).toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2">₹{row.operating_cash_flow_cr}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DashboardCard>

            {/* Ingestion History Card */}
            <DashboardCard
              title="Company Statement Upload History"
              subtitle={`Previous ingestion batches for ${companyId}`}
            >
              {historyLoading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Loading upload history...</span>
                </div>
              ) : uploadHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No previous statement uploads recorded</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Upload your first 20-column CSV above to populate history
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="px-3.5 py-2.5">Date &amp; Time</th>
                        <th className="px-3.5 py-2.5">File Name</th>
                        <th className="px-3.5 py-2.5">Quarters Ingested</th>
                        <th className="px-3.5 py-2.5">Records</th>
                        <th className="px-3.5 py-2.5">Uploaded By</th>
                        <th className="px-3.5 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {uploadHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="px-3.5 py-2.5 text-slate-500 font-mono text-[11px]">
                            {item.created_at}
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-slate-900">
                            {item.filename}
                          </td>
                          <td className="px-3.5 py-2.5 text-blue-700 font-mono text-[11px]">
                            {item.quarters_uploaded || "N/A"}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono">
                            {item.records_count}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-500">
                            {item.uploader_name || item.uploader_email || "System"}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DashboardCard>
          </div>

          {/* Right Column: Schema Guide & Verification Rules */}
          <div className="lg:col-span-4 space-y-6">
            <DashboardCard
              title="20-Column Schema Specification"
              subtitle="All fields required for full financial intelligence"
            >
              <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                {REQUIRED_CSV_FIELDS.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-700 flex items-center justify-between"
                  >
                    <span className="truncate">{field}</span>
                    <span className="text-[9px] text-blue-700 font-sans font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex-shrink-0">
                      {idx < 2 ? "Identity" : "Numeric (Cr)"}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard
              title="Security & Isolation Rules"
              subtitle="Automatic multi-company boundaries"
            >
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Automatic CID Binding:</strong> Records in the file are verified and strictly assigned to <strong>{companyId}</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Duplicate Prevention:</strong> If a quarter already exists, the engine safely updates the record without duplicating or corrupting history.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Zero Cross-Company Exposure:</strong> Only users authorized for <strong>{companyId}</strong> can view or alter these statements.
                  </p>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
