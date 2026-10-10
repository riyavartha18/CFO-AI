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
  const { companyId, setCompanyId } = useCompany();
  const [currentId, setCurrentId] = useState(companyId);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCurrentId(companyId);
  }, [companyId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentId.trim()) {
      setCompanyId(currentId.trim());
    }
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
            <span>Preferences saved successfully. Active target set to {companyId}.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Company Target */}
          <DashboardCard
            title="Active Target Company Entity"
            subtitle="Global context for all analytical models, rules, and forecasts"
          >
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Target Company Identifier (ID)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentId}
                    onChange={(e) => setCurrentId(e.target.value.toUpperCase())}
                    placeholder="e.g. C001, C002, ABC123"
                    className="flex-1 bg-slate-50 text-slate-900 text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Apply Target
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Changing the company ID updates the live Supabase query context across all analytical pages.
                </p>
              </div>
            </form>
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
