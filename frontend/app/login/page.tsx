"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { loginUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
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
      // Connects to the typed placeholder in frontend/lib/api.ts
      await loginUser({ email, password });
      router.push("/dashboard");
    } catch {
      setError("Unable to authenticate. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col justify-center items-center px-4 sm:px-6">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              SMART <span className="text-orange-500">CFO</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5">
            Sign in to access your financial intelligence workspace
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-2xl bg-[#121620] border border-zinc-800/90 p-7 shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="cfo@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded bg-zinc-900 border-zinc-700 text-orange-500 focus:ring-orange-500/30"
                />
                <span>Remember me</span>
              </label>
              <span className="text-orange-400/90 hover:underline cursor-pointer">
                Forgot password?
              </span>
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Login <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-orange-400 font-medium hover:underline"
            >
              Register company
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
