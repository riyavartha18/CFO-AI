"use client";

import React from "react";
import { Sliders, Clock, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { useCompany } from "@/lib/CompanyContext";

export default function WhatIfPage() {
  const { companyId } = useCompany();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                What-If Financial Stress Simulator
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {companyId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Coming Soon
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Forward sensitivity modeling across Solvency, Debt Covenants, and Health Scores for {companyId}.
            </p>
          </div>
        </div>

        {/* Coming Soon Notice Banner */}
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block text-amber-300 mb-0.5">Feature in Active Development for {companyId}</span>
            The What-If scenario simulation engine is currently being built in the Django backend. Dynamic recalculation of ML risk scores, covenant breach checks, and margin sensitivity for {companyId} upon adjusting variables will be unlocked once the simulation service is deployed.
          </div>
        </div>

        {/* Disabled Controls Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 opacity-50 pointer-events-none select-none">
          <div className="lg:col-span-5 space-y-4">
            <DashboardCard
              title={`Simulation Parameters for ${companyId} (Preview)`}
              subtitle="Sliders will connect to backend recalculation engine"
            >
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-300">Revenue Shock</span>
                    <span className="font-mono text-zinc-500">Disabled</span>
                  </div>
                  <input type="range" disabled className="w-full accent-zinc-600" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-300">Expense Variance</span>
                    <span className="font-mono text-zinc-500">Disabled</span>
                  </div>
                  <input type="range" disabled className="w-full accent-zinc-600" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-300">Debt Principal Variance</span>
                    <span className="font-mono text-zinc-500">Disabled</span>
                  </div>
                  <input type="range" disabled className="w-full accent-zinc-600" />
                </div>
              </div>
            </DashboardCard>
          </div>

          <div className="lg:col-span-7">
            <DashboardCard
              title={`Scenario Comparison Output (${companyId})`}
              subtitle="Baseline vs. Simulated metrics"
            >
              <div className="p-8 text-center text-xs text-zinc-500">
                <Sliders className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                Simulation outputs for {companyId} will appear here upon backend service integration.
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
