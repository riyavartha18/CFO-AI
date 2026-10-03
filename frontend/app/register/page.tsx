"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Building2,
  Tag,
  Briefcase,
  Users,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { registerCompany } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: "",
    companyId: "",
    industry: "",
    companySize: "51-200 employees",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.companyName ||
      !formData.companyId ||
      !formData.email ||
      !formData.password
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Connects to typed placeholder in frontend/lib/api.ts
      await registerCompany(formData);
      router.push("/dashboard");
    } catch {
      setError("Company registration could not be completed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-lg space-y-8">
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
            Register your company
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5">
            Configure dynamic multi-company risk tracking & financial intelligence
          </p>
        </div>

        <div className="rounded-2xl bg-[#121620] border border-zinc-800/90 p-7 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                name="companyName"
                placeholder="Apex Technologies"
                value={formData.companyName}
                onChange={handleChange}
                icon={<Building2 className="w-4 h-4" />}
                required
              />

              <Input
                label="Company ID"
                name="companyId"
                placeholder="e.g. C002, ABC123, COMP-01"
                value={formData.companyId}
                onChange={handleChange}
                icon={<Tag className="w-4 h-4" />}
                helperText="Dynamic identifier for financial records"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Industry"
                name="industry"
                placeholder="SaaS / Manufacturing / Retail"
                value={formData.industry}
                onChange={handleChange}
                icon={<Briefcase className="w-4 h-4" />}
                required
              />

              <div className="w-full space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300 tracking-wide uppercase">
                  Company Size
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-zinc-900/90 border border-zinc-800 px-3.5 py-2.5 pl-10 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="1-50 employees">1-50 employees</option>
                    <option value="51-200 employees">51-200 employees</option>
                    <option value="201-1000 employees">201-1,000 employees</option>
                    <option value="1000+ employees">1,000+ employees (Enterprise)</option>
                  </select>
                </div>
              </div>
            </div>

            <Input
              label="Executive Email"
              type="email"
              name="email"
              placeholder="controller@company.com"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Create strong master password"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              size="md"
              className="w-full mt-4"
              isLoading={isLoading}
            >
              Complete Registration <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
            Already registered?{" "}
            <Link
              href="/login"
              className="text-orange-400 font-medium hover:underline"
            >
              Sign in to workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
