"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Building2, UploadCloud, AlertCircle, Search, ChevronDown } from "lucide-react";
import { useCompany } from "@/lib/CompanyContext";
import { getHealth } from "@/lib/api";

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { companyId, setCompanyId, availableCompanies } = useCompany();
  const [customInput, setCustomInput] = useState(companyId);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    setCustomInput(companyId);
  }, [companyId]);

  useEffect(() => {
    getHealth()
      .then((res) => {
        setBackendOnline(res.status === "ok");
      })
      .catch(() => {
        setBackendOnline(false);
      });
  }, []);

  const handleApplyCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      setCompanyId(customInput.trim());
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected && selected !== "CUSTOM") {
      setCompanyId(selected);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Company Selector Controls */}
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hidden sm:flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider hidden md:inline">Company:</span>
          </div>

          {/* Quick Dropdown Selector */}
          <div className="relative">
            <select
              aria-label="Select Company"
              value={availableCompanies.includes(companyId) ? companyId : "CUSTOM"}
              onChange={handleSelectChange}
              className="bg-slate-50 text-slate-900 text-xs font-mono font-bold pl-3 pr-7 py-1.5 rounded-lg border border-slate-200/90 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none uppercase"
            >
              {availableCompanies.map((cid) => (
                <option key={cid} value={cid} className="bg-white text-slate-900">
                  {cid} {cid === "C001" ? "(Acme Corp)" : cid === "C002" ? "(Beta Ind)" : ""}
                </option>
              ))}
              {!availableCompanies.includes(companyId) && (
                <option value="CUSTOM" className="bg-white text-slate-900">{companyId} (Active)</option>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Search / Custom Company ID Input */}
          <form onSubmit={handleApplyCompany} className="relative flex items-center">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value.toUpperCase())}
              placeholder="Or enter ID..."
              className="w-28 sm:w-36 bg-slate-50 text-slate-900 text-xs font-mono font-medium pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-200/90 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase placeholder:text-slate-400"
              title="Enter any arbitrary company ID (e.g. C001, C002, ABC123)"
            />
            <button
              type="submit"
              className="absolute right-1.5 p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
              title="Load Company"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick preset 1-click test selector pills */}
          <div className="hidden lg:flex items-center gap-1 text-[11px]">
            {["C001", "C002", "ABC123"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setCompanyId(id)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                  companyId === id
                    ? "bg-blue-600 text-white font-bold border border-blue-700 shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Backend live status badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold">
          {backendOnline === true ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-700">Django API Live</span>
            </>
          ) : backendOnline === false ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[11px] font-bold text-rose-700">Backend Offline</span>
            </>
          ) : (
            <span className="text-[11px] font-medium text-slate-500">Connecting...</span>
          )}
        </div>

        {/* CSV Upload Quick Link */}
        <Link
          href="/csv-upload"
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
        >
          <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
          <span>Upload CSV</span>
        </Link>

        {/* Profile Avatar */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">
            CF
          </div>
        </div>
      </div>
    </header>
  );
}
