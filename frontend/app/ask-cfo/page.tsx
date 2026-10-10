"use client";

import React from "react";
import { MessageSquare, Clock, AlertCircle, Bot, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCompany } from "@/lib/CompanyContext";

export default function AskCFOPage() {
  const { companyId } = useCompany();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Ask Smart CFO AI Assistant
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" /> Coming Soon
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Natural language financial queries, covenant alerts, and cash burn synthesis for {companyId}.
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
              Feature in Active Development for {companyId}
            </span>
            <p className="text-slate-500 leading-relaxed">
              The conversational CFO reasoning agent is being developed to connect with LLM backend endpoints. Interactive natural language queries concerning <strong>{companyId}</strong>&apos;s financials will be unlocked once the AI assistant service is deployed.
            </p>
          </div>
        </div>

        {/* Disabled Chat Preview Shell */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col h-[480px] overflow-hidden opacity-60 pointer-events-none select-none">
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center text-xs text-slate-500 space-y-2 bg-slate-50">
            <Bot className="w-10 h-10 text-slate-400 mb-2" />
            <p className="font-bold text-slate-800 text-sm">
              Conversational Executive Assistant for {companyId}
            </p>
            <p className="max-w-md mx-auto text-slate-500">
              Ask questions such as: &quot;What is {companyId}&apos;s cash runway for the next 4 quarters?&quot; or &quot;Why did {companyId}&apos;s interest coverage ratio shift?&quot;
            </p>
          </div>

          <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              disabled
              placeholder={`Ask CFO AI assistant about ${companyId}... (Coming Soon)`}
              className="flex-1 bg-slate-100 text-slate-500 text-xs px-4 py-2.5 rounded-xl border border-slate-200"
            />
            <button disabled className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl opacity-50">
              Send
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
