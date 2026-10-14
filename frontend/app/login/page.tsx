"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useCompany } from "@/lib/CompanyContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useCompany();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to authenticate. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              SMART <span className="text-blue-600">CFO</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Secure Platform Sign In
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your company-isolated financial intelligence workspace
          </p>
        </div>

        {/* Demo Fast-Login Pill */}
        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
            <span>Preset Demo Company Logins</span>
          </div>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Select a verified benchmark company to load historical statements:
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleFillDemo("cfo@c001.com")}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-blue-200 hover:border-blue-400 text-[11px] font-bold text-blue-800 shadow-2xs transition-all text-center cursor-pointer"
            >
              C001 (Acme)
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo("cfo@c002.com")}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-blue-200 hover:border-blue-400 text-[11px] font-bold text-blue-800 shadow-2xs transition-all text-center cursor-pointer"
            >
              C002 (NovaTech)
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo("cfo@c003.com")}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-blue-200 hover:border-blue-400 text-[11px] font-bold text-blue-800 shadow-2xs transition-all text-center cursor-pointer"
            >
              C003 (Apex)
            </button>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="cfo@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-blue-500/30"
                />
                <span>Remember session</span>
              </label>
              <span className="text-slate-400">Password: Password123!</span>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white">
              Sign In to Workspace <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Need to register a new enterprise?{" "}
            <Link href="/register" className="text-blue-600 font-bold hover:underline">
              Register company
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
