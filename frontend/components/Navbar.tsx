"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  Building2,
  UploadCloud,
  AlertCircle,
  LogOut,
  ChevronDown,
  ShieldCheck,
  User,
} from "lucide-react";
import { useCompany } from "@/lib/CompanyContext";
import { getHealth } from "@/lib/api";

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const {
    companyId,
    companyName,
    setCompanyId,
    availableCompanies,
    user,
    isAuthenticated,
    logout,
  } = useCompany();

  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    getHealth()
      .then((res) => {
        setBackendOnline(res.status === "ok");
      })
      .catch(() => {
        setBackendOnline(false);
      });
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected) {
      setCompanyId(selected);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
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

        {/* Company Identity Badge & Scoped Selector */}
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">
              Company:
            </span>
          </div>

          {/* Company Identity Badge - Read-Only for normal company users */}
          {(!isAuthenticated || (user?.role !== "admin" && user?.role !== "platform_admin")) ? (
            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/90 flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-900">{companyId}</span>
              {companyName && (
                <span className="text-xs text-slate-500 font-medium hidden md:inline">
                  · {companyName}
                </span>
              )}
            </div>
          ) : availableCompanies.length > 1 ? (
            <div className="relative">
              <select
                aria-label="Select Authorized Company"
                value={companyId}
                onChange={handleSelectChange}
                className="bg-slate-50 text-slate-900 text-xs font-mono font-bold pl-3 pr-7 py-1.5 rounded-lg border border-slate-200/90 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none uppercase"
              >
                {availableCompanies.map((cid) => (
                  <option key={cid} value={cid} className="bg-white text-slate-900">
                    {cid} {cid === companyId && companyName ? `(${companyName})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/90 flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-900">{companyId}</span>
              {companyName && (
                <span className="text-xs text-slate-500 font-medium hidden md:inline">
                  · {companyName}
                </span>
              )}
            </div>
          )}

          {/* Security Verification Tag */}
          <div className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Scoped &amp; Isolated</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Backend status indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold">
          {backendOnline === true ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-700">Django API Live</span>
            </>
          ) : backendOnline === false ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[11px] font-bold text-rose-700">API Offline</span>
            </>
          ) : (
            <span className="text-[11px] font-medium text-slate-400">Connecting...</span>
          )}
        </div>

        {/* CSV Upload Quick Action */}
        <Link
          href="/csv-upload"
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors"
        >
          <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
          <span>Upload CSV</span>
        </Link>

        {/* User Account & Session Controls */}
        {isAuthenticated && user ? (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                {user.full_name || user.email}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                {user.role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              {(user.full_name || user.email).charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
