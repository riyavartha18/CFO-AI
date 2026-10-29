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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F8FC] text-slate-900 selection:bg-blue-500/20 selection:text-blue-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-6 sm:px-12 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 block">
              SMART <span className="text-blue-600">CFO</span>
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
          <a href="#overview" className="hover:text-blue-600 transition-colors">
            Overview
          </a>
          <a href="#features" className="hover:text-blue-600 transition-colors">
            Features
          </a>
          <a href="#architecture" className="hover:text-blue-600 transition-colors">
            How It Works
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-xs font-bold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Explore Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 sm:px-12 max-w-6xl mx-auto text-center">
        {/* Soft background blue glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-8 shadow-xs">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          AI &amp; Rule-Engine Powered Financial Intelligence
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.1]">
          Your Financial Intelligence.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
            Smarter Decisions.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
          Smart CFO analyzes company financial statements, detects critical liquidity &amp; debt risks, provides root-cause backward chaining explanations, and forecasts performance for decisive financial leadership.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open CFO Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200/90 shadow-sm transition-all cursor-pointer"
          >
            Register Company
          </Link>
        </div>

        {/* Hero Preview Card */}
        <div className="mt-16 rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-6 shadow-xl relative overflow-hidden text-left">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-500 opacity-80" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs text-slate-500 font-semibold block">Financial Health</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block font-mono">86/100</span>
              <span className="text-xs text-emerald-700 font-bold">Strong Solvency</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs text-slate-500 font-semibold block">Current Risk Status</span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block font-mono">Low Risk</span>
              <span className="text-xs text-slate-500">94.2% ML Confidence</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs text-slate-500 font-semibold block">Total Revenue</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block font-mono">₹142.8 Cr</span>
              <span className="text-xs text-emerald-700 font-bold">+12.4% YoY</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs text-slate-500 font-semibold block">Operating Cash Flow</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block font-mono">₹31.2 Cr</span>
              <span className="text-xs text-emerald-700 font-bold">1.48x Coverage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Overview Section */}
      <section id="overview" className="py-16 px-6 sm:px-12 max-w-6xl mx-auto border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Automating the Financial Reasoning of an Elite CFO
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            Combining predictive Machine Learning models with deterministic forward and backward chaining rule engines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Full-Spectrum Ratios</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Computes 15 comprehensive financial indicators across Liquidity, Leverage, Profitability, and Cash Flow Growth from raw financial statements.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Dual-Engine Risk Detection</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Trained Random Forest classifier identifies overall financial distress probability, while the rule engine identifies specific domain vulnerabilities.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-4">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Explainable Backward Chaining</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              No black boxes. Every detected risk comes with human-readable telemetry explaining exactly which metric crossed safety thresholds and why.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section id="features" className="py-16 px-6 sm:px-12 max-w-6xl mx-auto border-t border-slate-200/80">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              From Raw Quarterly Financials to Strategic Action Plans
            </h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
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
                <div key={i} className="flex items-start space-x-3 text-sm text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
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
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{item.name}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{item.rule}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="architecture" className="py-16 px-6 sm:px-12 max-w-6xl mx-auto border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How Smart CFO Operates
          </h2>
          <p className="mt-3 text-sm text-slate-500">
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
            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative">
              <span className="text-2xl font-extrabold text-blue-600 block mb-2 font-mono">{item.step}</span>
              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 sm:px-12 max-w-4xl mx-auto text-center">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white p-10 sm:p-16 relative overflow-hidden shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Experience Next-Generation Financial Oversight
          </h2>
          <p className="mt-4 text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
            Ready to analyze company financials and preempt financial risks? Get started with our interactive demo environment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-700/60 hover:bg-blue-700 text-white font-bold text-sm border border-white/20 transition-all cursor-pointer"
            >
              Executive Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/90 py-10 px-6 sm:px-12 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 bg-white rounded-t-2xl mt-8">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-900">SMART CFO SYSTEM</span>
          <span>© {new Date().getFullYear()} All Rights Reserved.</span>
        </div>
        <div className="flex items-center space-x-6 mt-4 sm:mt-0">
          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-blue-600" /> Enterprise Grade Encryption
          </span>
          <Link href="/dashboard" className="hover:text-blue-600 font-medium">
            Dashboard
          </Link>
          <Link href="/csv-upload" className="hover:text-blue-600 font-medium">
            CSV Upload
          </Link>
        </div>
      </footer>
    </div>
  );
}
