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
    // Check backend health
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
    <header className="sticky top-0 z-30 h-16 bg-[#090b0f]/80 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Company Selector Controls */}
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 hidden sm:flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider hidden md:inline">Company:</span>
          </div>

          {/* Quick Dropdown Selector */}
          <div className="relative">
            <select
              aria-label="Select Company"
              value={availableCompanies.includes(companyId) ? companyId : "CUSTOM"}
              onChange={handleSelectChange}
              className="bg-[#121620] text-zinc-100 text-xs font-mono font-bold pl-3 pr-7 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer appearance-none uppercase"
            >
              {availableCompanies.map((cid) => (
                <option key={cid} value={cid}>
                  {cid} {cid === "C001" ? "(Acme Corp)" : cid === "C002" ? "(Beta Ind)" : ""}
                </option>
              ))}
              {!availableCompanies.includes(companyId) && (
                <option value="CUSTOM">{companyId} (Active)</option>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Search / Custom Company ID Input */}
          <form onSubmit={handleApplyCompany} className="relative flex items-center">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value.toUpperCase())}
              placeholder="Or enter ID..."
              className="w-28 sm:w-36 bg-[#121620] text-zinc-100 text-xs font-mono font-medium pl-2.5 pr-7 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-orange-500 uppercase placeholder:text-zinc-600"
              title="Enter any arbitrary company ID (e.g. C001, C002, ABC123)"
            />
            <button
              type="submit"
              className="absolute right-1.5 p-1 text-zinc-400 hover:text-orange-400 rounded transition-colors"
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
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Backend live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs">
          {backendOnline === true ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-400">Django API Live</span>
            </>
          ) : backendOnline === false ? (
            <>
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span className="text-[11px] font-medium text-rose-400">Backend Offline</span>
            </>
          ) : (
            <span className="text-[11px] font-medium text-zinc-500">Connecting...</span>
          )}
        </div>

        {/* CSV Upload link */}
        <Link
          href="/csv-upload"
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 text-xs font-medium border border-zinc-700/60"
        >
          <UploadCloud className="w-3.5 h-3.5 text-zinc-400" />
          <span>Upload CSV</span>
        </Link>

        {/* Profile Avatar */}
        <div className="flex items-center space-x-2 pl-2 border-l border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-200">
            CF
          </div>
        </div>
      </div>
    </header>
  );
}
