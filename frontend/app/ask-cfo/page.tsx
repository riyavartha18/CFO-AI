"use client";

import React from "react";
import { MessageSquare, Clock, AlertCircle, Bot } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { useCompany } from "@/lib/CompanyContext";

export default function AskCFOPage() {
  const { companyId } = useCompany();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Ask Smart CFO AI Assistant
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                Target: {companyId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Coming Soon
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Natural language financial queries, covenant alerts, and cash burn synthesis for {companyId}.
            </p>
          </div>
        </div>

        {/* Coming Soon Notice Banner */}
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block text-amber-300 mb-0.5">Feature in Active Development for {companyId}</span>
            The conversational CFO reasoning agent is being developed to connect with LLM backend endpoints. Interactive natural language queries concerning {companyId}&apos;s financials will be unlocked once the AI assistant endpoint is published.
          </div>
        </div>

        {/* Disabled Chat Preview Shell */}
        <div className="rounded-2xl bg-[#121620] border border-zinc-800 flex flex-col h-[480px] overflow-hidden opacity-50 pointer-events-none select-none">
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center text-xs text-zinc-500 space-y-2">
            <Bot className="w-10 h-10 text-zinc-600 mb-2" />
            <p className="font-medium text-zinc-300">
              Conversational Executive Assistant for {companyId}
            </p>
            <p className="max-w-md mx-auto text-zinc-500">
              Ask questions such as: &quot;What is {companyId}&apos;s cash runway for the next 4 quarters?&quot; or &quot;Why did {companyId}&apos;s interest coverage ratio shift?&quot;
            </p>
          </div>

          <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
            <input
              type="text"
              disabled
              placeholder={`Ask CFO AI assistant about ${companyId}... (Coming Soon)`}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-xs text-zinc-600"
            />
            <button
              disabled
              className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-500 text-xs font-medium cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
