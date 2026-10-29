"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Cpu,
  Bell,
  Shield,
  Save,
  CheckCircle2,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";

import { useCompany } from "@/lib/CompanyContext";

export default function SettingsPage() {
  const { companyId, companyName, company, user } = useCompany();
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              System Settings &amp; Engine Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage company profile, rule engine sensitivity thresholds, and backend endpoints.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>

        {saved && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>System preferences saved successfully. Workspace bound to {companyId}.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Profile & Workspace Identity */}
          <DashboardCard
            title="Authorized Company Profile"
            subtitle="Authenticated corporate entity bound to current session"
          >
            <div className="space-y-4 pt-1 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                <div>
                  <span className="font-bold text-slate-900 block">Company Identifier (CID)</span>
                  <span className="text-slate-500 text-[11px]">Assigned multi-tenant company ID</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                    {companyId}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                <div>
                  <span className="font-bold text-slate-900 block">Registered Entity Name</span>
                  <span className="text-slate-500 text-[11px]">Primary organization name in database</span>
                </div>
                <span className="font-bold text-slate-900">
                  {company?.company_name || companyName}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                <div>
                  <span className="font-bold text-slate-900 block">Industry &amp; Scale</span>
                  <span className="text-slate-500 text-[11px]">Corporate sector and classification</span>
                </div>
                <span className="text-slate-700 font-medium">
                  {company?.industry || "Technology"} · {company?.company_size || "Enterprise"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                <div>
                  <span className="font-bold text-slate-900 block">User Access Role</span>
                  <span className="text-slate-500 text-[11px]">Assigned tenant authorization level</span>
                </div>
                <span className="font-mono font-bold uppercase text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
                  {user?.role || "Owner"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-700 leading-relaxed flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  All financial statements, forecasts, and AI rules are cryptographically scoped to {companyId}. Cross-company switching is locked.
                </span>
              </div>
            </div>
          </DashboardCard>

          {/* Engine Parameters */}
          <DashboardCard
            title="Backend Model Parameters"
            subtitle="Machine Learning model contamination and sensitivity bounds"
          >
            <div className="space-y-4 pt-1 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                <div>
                  <span className="font-bold text-slate-900 block">Anomaly Isolation Forest Outlier Contamination</span>
                  <span className="text-slate-500 text-[11px]">Expected proportion of outliers in baseline data</span>
                </div>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  10.0%
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                <div>
                  <span className="font-bold text-slate-900 block">Rule Engine Rule Base</span>
                  <span className="text-slate-500 text-[11px]">Production financial rules for backward reasoning</span>
                </div>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  10 Active Rules
                </span>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
