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
  Sliders,
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
    name: "What-if",
    href: "/what-if",
    icon: Sliders,
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
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0d1117] border-r border-zinc-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-800/80">
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.35)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">
                SMART <span className="text-orange-500">CFO</span>
              </span>
              <span className="text-[10px] tracking-widest text-zinc-400 uppercase block font-semibold">
                Financial Intel
              </span>
            </div>
          </Link>
        </div>

        {/* Upload Quick Action */}
        <div className="p-4 border-b border-zinc-800/50">
          <Link
            href="/csv-upload"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/30 text-orange-400 transition-all text-xs font-medium group"
          >
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
              <span>Upload Financial CSV</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-orange-400/60" />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800 text-white border-l-2 border-orange-500 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-orange-400" : "text-zinc-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* System telemetry card */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
            <span>Engine Status</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ready
            </span>
          </div>
          <div className="text-[10px] text-zinc-400">
            ML Classifier + Rule Engine active
          </div>
        </div>
      </aside>
    </>
  );
}
