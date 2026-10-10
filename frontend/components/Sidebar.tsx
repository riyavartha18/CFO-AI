"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  GitCompare,
  MessageSquare,
  Settings,
  UploadCloud,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const navigationItems = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Financial Analysis",
    href: "/financial-analysis",
    icon: LineChart,
  },
  {
    name: "Risk Analysis",
    href: "/risk-analysis",
    icon: ShieldAlert,
  },
  {
    name: "Anomaly Detection",
    href: "/anomaly-detection",
    icon: AlertTriangle,
    badge: "ML",
  },
  {
    name: "Forecast",
    href: "/forecast",
    icon: TrendingUp,
  },
  {
    name: "Company Comparison",
    href: "/company-comparison",
    icon: GitCompare,
  },
  {
    name: "Ask Smart CFO",
    href: "/ask-cfo",
    icon: MessageSquare,
    badge: "AI",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-xs ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200/80 bg-white">
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block">
                SMART <span className="text-blue-600">CFO</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase block font-bold">
                Financial Intel
              </span>
            </div>
          </Link>
        </div>

        {/* Upload Quick Action */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <Link
            href="/csv-upload"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 transition-all text-xs font-bold group shadow-xs"
          >
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>Upload Financial CSV</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-blue-500/70" />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/forecast"
                ? pathname === "/forecast" || pathname.startsWith("/forecast/") || pathname === "/what-if"
                : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-blue-600" : "text-slate-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                      isActive
                        ? "bg-blue-200/80 text-blue-800"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/70 text-slate-500">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-700">Supabase DB</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Connected</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
