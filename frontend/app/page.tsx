import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BarChart3,
  Layers,
  CheckCircle2,
  Lock,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 selection:bg-orange-500/30 selection:text-orange-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 h-20 bg-[#07090e]/80 backdrop-blur-md border-b border-zinc-800/80 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white block">
              SMART <span className="text-orange-500">CFO</span>
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-400">
          <a href="#overview" className="hover:text-white transition-colors">
            Overview
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#architecture" className="hover:text-white transition-colors">
            How It Works
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" className="hidden sm:inline-flex">
              Explore Demo <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 sm:px-12 max-w-6xl mx-auto text-center">
        {/* Subtle orange glow orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <Cpu className="w-3.5 h-3.5" />
          AI & Rule-Engine Powered Financial Intelligence
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Your Financial Intelligence.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
            Smarter Decisions.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Smart CFO analyzes company financial statements, detects critical liquidity & debt risks, provides root-cause backward chaining explanations, and forecasts performance for decisive financial leadership.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto px-8">
              Open CFO Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8">
              Register Company
            </Button>
          </Link>
        </div>

        {/* Hero Preview Card */}
        <div className="mt-16 rounded-2xl bg-[#121620] border border-zinc-800/90 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-75" />
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-xs text-zinc-400 block">Financial Health</span>
              <span className="text-2xl font-bold text-white mt-1 block">86/100</span>
              <span className="text-xs text-emerald-400 font-medium">Strong Solvency</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-xs text-zinc-400 block">Current Risk Status</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">Low Risk</span>
              <span className="text-xs text-zinc-400">94.2% ML Confidence</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-xs text-zinc-400 block">Total Revenue</span>
              <span className="text-2xl font-bold text-white mt-1 block">₹142.8 Cr</span>
              <span className="text-xs text-emerald-400">+12.4% YoY</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-xs text-zinc-400 block">Operating Cash Flow</span>
              <span className="text-2xl font-bold text-white mt-1 block">₹31.2 Cr</span>
              <span className="text-xs text-emerald-400">1.48x Debt Coverage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Overview Section */}
      <section id="overview" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Automating the Financial Reasoning of an Elite CFO
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            Combining predictive Machine Learning models with deterministic forward and backward chaining rule engines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#121620] border border-zinc-800/80">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Full-Spectrum Ratios</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Computes 15 comprehensive financial indicators across Liquidity, Leverage, Profitability, and Cash Flow Growth from raw financial statements.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#121620] border border-zinc-800/80">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Dual-Engine Risk Detection</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Trained Random Forest classifier identifies overall financial distress probability, while the rule engine identifies specific domain vulnerabilities.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#121620] border border-zinc-800/80">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Explainable Backward Chaining</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              No black boxes. Every detected risk comes with human-readable telemetry explaining exactly which metric crossed safety thresholds and why.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section id="features" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              From Raw Quarterly Financials to Strategic Action Plans
            </h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              Smart CFO bridges accounting records and strategic execution, enabling financial directors and leadership teams to act preemptively.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Multi-quarter trend tracking for revenue, EBITDA, and debt covenants",
                "Automated quarterly CSV schema verification with 20 data integrity checks",
                "Dynamic What-If simulation for margin shocks, interest spikes, and Capex",
                "Cross-company ratio benchmarking across custom corporate portfolios",
                "Instant AI dialog for CFO queries, cash runway, and covenant monitoring",
              ].map((feat, i) => (
                <div key={i} className="flex items-start space-x-3 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#121620] border border-zinc-800/80 p-6 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Production Rule Engine Checks
            </h4>
            <div className="space-y-3">
              {[
                { name: "Liquidity Ratio Test", rule: "Current Ratio < 1.0 (Critical) / 1.0 - 1.5 (Watchlist)", status: "Pass" },
                { name: "Debt-to-Equity Covenants", rule: "D/E > 3.0 (Overleveraged) / 2.0 - 3.0 (Moderate)", status: "Pass" },
                { name: "Interest Coverage Threshold", rule: "EBIT / Interest Expense < 1.5x", status: "Pass" },
                { name: "Cash Generation Integrity", rule: "Operating Cash Flow < 0", status: "Pass" },
                { name: "Growth Drag Alert", rule: "Revenue Growth < -5% or Profit Growth < -10%", status: "Monitored" },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-zinc-200 block">{item.name}</span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">{item.rule}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="architecture" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How Smart CFO Operates
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            A production architecture that separates presentation, API orchestration, database security, and ML reasoning.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Ingestion & Validation", desc: "Upload quarterly CSV; 20 data integrity checks verify required columns and clean formatting." },
            { step: "02", title: "Feature Extraction", desc: "Derives EBITDA, Net Profit, Equity, and computes 15 standard financial ratios." },
            { step: "03", title: "Dual Intelligence", desc: "RandomForest ML classifies distress probability while rule engine evaluates domain risk triggers." },
            { step: "04", title: "Executive Decision", desc: "Actionable quarterly dashboard with backward chaining explains exact root causes for leadership." },
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-[#121620] border border-zinc-800/80 relative">
              <span className="text-2xl font-extrabold text-orange-500/60 block mb-2">{item.step}</span>
              <h3 className="text-sm font-semibold text-zinc-100">{item.title}</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 sm:px-12 max-w-4xl mx-auto text-center">
        <div className="rounded-3xl bg-gradient-to-b from-[#161c28] to-[#0f131c] border border-orange-500/20 p-10 sm:p-16 relative overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.08)]">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Experience Next-Generation Financial Oversight
          </h2>
          <p className="mt-4 text-sm text-zinc-400 max-w-xl mx-auto">
            Ready to analyze company financials and preempt financial risks? Get started with our interactive demo environment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto px-8">
                Launch Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                Executive Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-10 px-6 sm:px-12 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="font-semibold text-zinc-300">SMART CFO SYSTEM</span>
          <span>© {new Date().getFullYear()} All Rights Reserved.</span>
        </div>
        <div className="flex items-center space-x-6 mt-4 sm:mt-0">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Lock className="w-3.5 h-3.5" /> Enterprise Grade Encryption
          </span>
          <Link href="/dashboard" className="hover:text-zinc-200">
            Dashboard
          </Link>
          <Link href="/csv-upload" className="hover:text-zinc-200">
            CSV Upload
          </Link>
        </div>
      </footer>
    </div>
  );
}
