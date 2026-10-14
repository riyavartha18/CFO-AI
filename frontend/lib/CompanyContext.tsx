"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getCompanies,
  getCurrentUser,
  loginUser,
  registerCompany,
  clearAuthToken,
  UserProfile,
  CompanyProfile,
  AuthResponse
} from "./api";

interface CompanyContextType {
  companyId: string;
  companyName: string;
  setCompanyId: (id: string) => void;
  availableCompanies: string[];
  user: UserProfile | null;
  company: CompanyProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  register: (data: {
    companyName: string;
    email: string;
    password: string;
    industry?: string;
    companySize?: string;
    fullName?: string;
  }) => Promise<AuthResponse>;
  logout: () => void;
}

const CompanyContext = createContext<CompanyContextType>({
  companyId: "C001",
  companyName: "Acme Corporation",
  setCompanyId: () => {},
  availableCompanies: ["C001", "C002", "C003"],
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => { throw new Error("Context not ready"); },
  register: async () => { throw new Error("Context not ready"); },
  logout: () => {},
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companyId, setCompanyIdState] = useState<string>("C001");
  const [companyName, setCompanyName] = useState<string>("Acme Corporation");
  const [availableCompanies, setAvailableCompanies] = useState<string[]>(["C001", "C002", "C003"]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session or load initial companies
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("smart_cfo_token");
      if (token) {
        try {
          const profile = await getCurrentUser();
          if (isMounted && profile && profile.authenticated) {
            setUser(profile.user);
            setCompany(profile.company);
            setIsAuthenticated(true);
            const userCid = profile.company?.company_id || "C001";
            setCompanyIdState(userCid);
            setCompanyName(profile.company?.company_name || `Company ${userCid}`);
            // Strictly scope to authenticated company only
            setAvailableCompanies([userCid]);
            setIsLoading(false);
            return;
          }
        } catch {
          // Token expired or invalid
          clearAuthToken();
        }
      }

      // Fallback guest/demo mode
      const savedCid = localStorage.getItem("smart_cfo_company_id") || "C001";
      if (isMounted) {
        setCompanyIdState(savedCid);
        setIsAuthenticated(false);
        setIsLoading(false);
      }

      getCompanies().then((companies) => {
        if (isMounted && companies && companies.length > 0) {
          setAvailableCompanies(companies);
        }
      });
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const authData = await loginUser(credentials);
      setUser(authData.user);
      setCompany(authData.company);
      setIsAuthenticated(true);

      const cid = authData.company.company_id;
      setCompanyIdState(cid);
      setCompanyName(authData.company.company_name || `Company ${cid}`);

      // Scope available companies strictly to authorized memberships
      const allowed = authData.available_companies?.map(c => c.company_id) || [cid];
      setAvailableCompanies(allowed);

      if (typeof window !== "undefined") {
        localStorage.setItem("smart_cfo_company_id", cid);
        localStorage.setItem("smart_cfo_company", JSON.stringify(authData.company));
        localStorage.setItem("smart_cfo_user", JSON.stringify(authData.user));
      }

      return authData;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: {
    companyName: string;
    email: string;
    password: string;
    industry?: string;
    companySize?: string;
    fullName?: string;
  }) => {
    setIsLoading(true);
    try {
      const authData = await registerCompany(data);
      setUser(authData.user);
      setCompany(authData.company);
      setIsAuthenticated(true);

      const cid = authData.company.company_id;
      setCompanyIdState(cid);
      setCompanyName(authData.company.company_name);

      // Lock to newly registered company only
      setAvailableCompanies([cid]);

      if (typeof window !== "undefined") {
        localStorage.setItem("smart_cfo_company_id", cid);
        localStorage.setItem("smart_cfo_company", JSON.stringify(authData.company));
        localStorage.setItem("smart_cfo_user", JSON.stringify(authData.user));
      }

      return authData;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setCompany(null);
    setIsAuthenticated(false);
    setCompanyIdState("C001");
    setCompanyName("Acme Corporation");
    setAvailableCompanies(["C001", "C002", "C003"]);

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const setCompanyId = useCallback((id: string) => {
    if (!id) return;
    const cleanId = id.trim().toUpperCase();

    // Guard: Normal authenticated company users cannot switch to unauthorized companies
    if (isAuthenticated && user?.role !== "admin" && user?.role !== "platform_admin") {
      if (!availableCompanies.includes(cleanId)) {
        console.warn(`Unauthorized company switch attempt to ${cleanId} blocked.`);
        return;
      }
    }

    setCompanyIdState(cleanId);

    if (typeof window !== "undefined") {
      localStorage.setItem("smart_cfo_company_id", cleanId);
      const url = new URL(window.location.href);
      url.searchParams.set("company", cleanId);
      window.history.replaceState({}, "", url.toString());
    }
  }, [isAuthenticated, user?.role, availableCompanies]);

  return (
    <CompanyContext.Provider
      value={{
        companyId,
        companyName,
        setCompanyId,
        availableCompanies,
        user,
        company,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
