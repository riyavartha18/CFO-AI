"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCompanies } from "./api";

interface CompanyContextType {
  companyId: string;
  setCompanyId: (id: string) => void;
  availableCompanies: string[];
}

const CompanyContext = createContext<CompanyContextType>({
  companyId: "C001",
  setCompanyId: () => {},
  availableCompanies: ["C001", "C002"],
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companyId, setCompanyIdState] = useState<string>("C001");
  const [availableCompanies, setAvailableCompanies] = useState<string[]>(["C001", "C002"]);

  useEffect(() => {
    // 1. Fetch live available companies from Django API
    getCompanies().then((companies) => {
      if (companies && companies.length > 0) {
        setAvailableCompanies((prev) => {
          const merged = Array.from(new Set([...companies, ...prev]));
          return merged;
        });
      }
    });

    // 2. Check if company is in URL search params or localStorage
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCompany = params.get("company");
      if (urlCompany) {
        const clean = urlCompany.trim().toUpperCase();
        setCompanyIdState(clean);
        setAvailableCompanies((prev) => Array.from(new Set([...prev, clean])));
      } else {
        const saved = localStorage.getItem("smart_cfo_company_id");
        if (saved) {
          const clean = saved.trim().toUpperCase();
          setCompanyIdState(clean);
          setAvailableCompanies((prev) => Array.from(new Set([...prev, clean])));
        }
      }
    }
  }, []);

  const setCompanyId = useCallback((id: string) => {
    if (!id) return;
    const cleanId = id.trim().toUpperCase();
    setCompanyIdState(cleanId);
    setAvailableCompanies((prev) => Array.from(new Set([...prev, cleanId])));

    if (typeof window !== "undefined") {
      localStorage.setItem("smart_cfo_company_id", cleanId);
      
      // Update URL search param seamlessly without full page reload
      const url = new URL(window.location.href);
      url.searchParams.set("company", cleanId);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  return (
    <CompanyContext.Provider value={{ companyId, setCompanyId, availableCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
