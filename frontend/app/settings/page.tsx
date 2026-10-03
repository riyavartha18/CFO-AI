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
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              System Settings & Engine Configuration
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Manage company profile, rule engine sensitivity thresholds, and backend endpoints.
            </p>
          </div>

          <Button size="sm" onClick={handleSave}>
            <Save className="w-3.5 h-3.5 mr-1" /> Save Preferences
          </Button>
        </div>

        {saved && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences saved successfully.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Profile Settings */}
          <DashboardCard
            title="Company Information"
            subtitle="Default parameters for financial record association"
          >
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Company Name"
                defaultValue="Nexus Dynamics Corp."
                placeholder="Enterprise Legal Name"
              />

              <Input
                label="Primary Company ID"
                value={currentId}
                onChange={(e) => setCurrentId(e.target.value.toUpperCase())}
                placeholder="Dynamic ID (e.g. C001, C002, ABC123)"
                helperText="Matches the company_id column in financial_records"
              />

              <Input
                label="Reporting Currency"
                defaultValue="INR (₹ in Crores)"
                disabled
                helperText="Default standard currency unit"
              />

              <div className="pt-2">
                <Button type="submit" size="sm" variant="secondary">
                  Update Profile
                </Button>
              </div>
            </form>
          </DashboardCard>

          {/* Engine Parameters & Sensitivity */}
          <DashboardCard
            title="Rule Engine Thresholds"
            subtitle="Deterministic forward and backward chaining limits"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
                <div className="flex justify-between font-semibold text-zinc-200">
                  <span>Liquidity Risk Threshold</span>
                  <span className="font-mono text-orange-400">Current Ratio &lt; 1.0</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Triggers High Liquidity Risk when current assets fall below current liabilities.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
                <div className="flex justify-between font-semibold text-zinc-200">
                  <span>Debt-to-Equity Covenants</span>
                  <span className="font-mono text-orange-400">D/E &gt; 3.0</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Triggers High Debt Risk when leverage exceeds 3.0x total equity.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
                <div className="flex justify-between font-semibold text-zinc-200">
                  <span>Interest Coverage Safety</span>
                  <span className="font-mono text-orange-400">IC &lt; 1.5x</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Flags solvency pressure when operating income barely covers interest expense.
                </p>
              </div>
            </div>
          </DashboardCard>

          {/* Backend Connection Indicator */}
          <DashboardCard
            title="Backend API Configuration"
            subtitle="Target REST API for financial engine calls"
          >
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">
                  Target Endpoint (NEXT_PUBLIC_API_URL)
                </label>
                <div className="p-2.5 rounded-lg bg-zinc-950 font-mono text-xs text-orange-400 border border-zinc-800">
                  {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <span className="font-semibold text-zinc-300 block">Architecture Guarantee:</span>
                <p>
                  Frontend remains fully decoupled from direct Supabase database credentials or ML model execution. All analysis requests flow through the Django REST API layer.
                </p>
              </div>
            </div>
          </DashboardCard>

          {/* Notification Preferences */}
          <DashboardCard
            title="Notification Alerts"
            subtitle="Automated alerts for financial risk detection"
          >
            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/40 border border-zinc-800 cursor-pointer">
                <div>
                  <span className="font-medium text-zinc-200 block">Critical Risk Alerts</span>
                  <span className="text-[11px] text-zinc-400">Notify immediately when High Risk or D/E &gt; 3.0 is detected</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-zinc-800 border-zinc-700 text-orange-500 focus:ring-orange-500/20"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/40 border border-zinc-800 cursor-pointer">
                <div>
                  <span className="font-medium text-zinc-200 block">Quarterly Statement Upload Alerts</span>
                  <span className="text-[11px] text-zinc-400">Receive validation summary when new quarterly CSV is ingested</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-zinc-800 border-zinc-700 text-orange-500 focus:ring-orange-500/20"
                />
              </label>
            </div>
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
