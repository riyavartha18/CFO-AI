// ============================================================
// SMART CFO - FRONTEND API CLIENT
// Connected to Django REST API at NEXT_PUBLIC_API_URL
//
// LIVE ENDPOINTS:
// 1. getHealth() -> GET /api/health/
// 2. getCompany(companyId) -> GET /api/company/<company_id>/
// 3. getCompanyAnalysis(companyId) -> GET /api/company/<company_id>/analysis/
// ============================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface HealthResponse {
  status: string;
}

export interface CompanyDetailsResponse {
  company_id: string;
  records_count: number;
  earliest_quarter: string;
  latest_quarter: string;
  status: string;
}

export interface FinancialMetrics {
  revenue: number;
  cogs: number;
  operating_expenses: number;
  ebitda: number;
  ebit: number;
  interest_expense: number;
  tax_expense: number;
  net_profit: number;
  cash: number;
  accounts_receivable: number;
  inventory: number;
  fixed_assets: number;
  current_assets: number;
  total_assets: number;
  accounts_payable: number;
  short_term_debt: number;
  long_term_debt: number;
  current_liabilities: number;
  total_debt: number;
  total_liabilities: number;
  equity: number;
  operating_cash_flow: number;
  investing_cash_flow: number;
  financing_cash_flow: number;
}

export interface QuarterlyTrendRecord {
  quarter: string;
  revenue: number;
  net_profit: number;
  cash: number;
  total_debt: number;
  operating_cash_flow: number;
  predicted_risk: string;
}

export interface CompanyAnalysisResponse {
  company_id: string;
  latest_quarter: string;
  predicted_risk: string;
  risk_probabilities: Record<string, number>;
  rule_based_risks: Array<{
    risk: string;
    rule: string;
    explanation: string[];
  }>;
  financial_metrics?: FinancialMetrics;
  financial_ratios?: Record<string, number>;
  quarterly_trends?: QuarterlyTrendRecord[];
}

/**
 * 1. Health check
 * GET /api/health/
 */
export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/health/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Unable to connect to Smart CFO backend (${res.status}).`);
  }

  return res.json();
}

export interface CompaniesResponse {
  companies: string[];
}

/**
 * Get list of available companies from Django backend
 * GET /api/companies/
 */
export async function getCompanies(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/companies/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return ["C001", "C002"];
    const data: CompaniesResponse = await res.json();
    return data.companies || ["C001", "C002"];
  } catch {
    return ["C001", "C002"];
  }
}



/**
 * 2. Company existence & basic details
 * GET /api/company/<company_id>/
 */
export async function getCompany(companyId: string): Promise<CompanyDetailsResponse> {
  const trimmedId = companyId.trim();
  const res = await fetch(`${API_BASE_URL}/company/${trimmedId}/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Company not found: "${trimmedId}".`);
    }
    throw new Error(`Unable to connect to Smart CFO backend (${res.status}).`);
  }

  return res.json();
}

/**
 * 3. Company financial risk analysis
 * GET /api/company/<company_id>/analysis/
 */
export async function getCompanyAnalysis(companyId: string): Promise<CompanyAnalysisResponse> {
  const trimmedId = companyId.trim();
  const res = await fetch(`${API_BASE_URL}/company/${trimmedId}/analysis/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Company not found: No financial records available for "${trimmedId}".`);
    }
    throw new Error(`Unable to connect to Smart CFO backend (${res.status}).`);
  }

  return res.json();
}

// ------------------------------------------------------------
// Stubs for future UI integrations (kept decoupled)
// ------------------------------------------------------------
export async function loginUser(credentials: { email: string; password?: string }) {
  return { success: true, email: credentials.email };
}

export async function registerCompany(data: { companyId: string; companyName: string }) {
  return { success: true, companyId: data.companyId };
}

export async function uploadFinancialCSV(file: File) {
  return { success: true, filename: file.name };
}

export async function runWhatIfScenario(scenario: Record<string, number>) {
  return { success: true, scenario };
}

export async function getCompanyComparison(companyIds: string[]) {
  return { success: true, companyIds };
}

export async function askSmartCFO(query: string, companyId: string = "C001") {
  return { query, companyId, answer: "AI assistant response placeholder" };
}
