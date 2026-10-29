// ============================================================
// SMART CFO - FRONTEND API CLIENT
// Multi-Company Secured Financial Intelligence Client
// ============================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("smart_cfo_token");
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("smart_cfo_token", token);
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("smart_cfo_token");
    localStorage.removeItem("smart_cfo_user");
    localStorage.removeItem("smart_cfo_company");
  }
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export interface HealthResponse {
  status: string;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface CompanyProfile {
  company_id: string;
  company_name: string;
  industry: string;
  company_size: string;
  role?: string;
  records_count?: number;
  earliest_quarter?: string;
  latest_quarter?: string;
  status?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: UserProfile;
  company: CompanyProfile;
  available_companies?: CompanyProfile[];
}

export interface CompanyDetailsResponse {
  company_id: string;
  company_name?: string;
  industry?: string;
  company_size?: string;
  records_count: number;
  earliest_quarter: string | null;
  latest_quarter: string | null;
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

export interface RecommendationItem {
  priority: "High" | "Medium" | "Low" | string;
  title: string;
  reasoning: string;
  metric_threshold: string;
  next_steps: string[];
  monitoring_metric: string;
}

export interface RuleBasedRisk {
  risk: string;
  rule: string;
  explanation: string[];
  slug?: string;
  severity?: string;
  category?: string;
  metric_name?: string;
  actual_value?: string;
  threshold_display?: string;
  potential_impact?: string;
  recommendations?: RecommendationItem[];
  action_plan?: {
    immediate_actions?: string[];
    medium_term_actions?: string[];
  };
  monitoring_metrics?: string[];
}

export interface CompanyAnalysisResponse {
  company_id: string;
  latest_quarter: string;
  predicted_risk: string;
  risk_probabilities: Record<string, number>;
  rule_based_risks: RuleBasedRisk[];
  financial_metrics?: FinancialMetrics;
  financial_ratios?: Record<string, number>;
  quarterly_trends?: QuarterlyTrendRecord[];
}

export interface CSVValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  row_count: number;
  quarters: string[];
  overlapping_quarters?: string[];
  preview: Record<string, any>[];
}

export interface CSVImportResponse {
  success: boolean;
  company_id: string;
  total_records: number;
  inserted: number;
  updated: number;
  quarters: string[];
}

export interface UploadHistoryItem {
  id: number;
  filename: string;
  records_count: number;
  quarters_uploaded: string;
  status: string;
  created_at: string;
  uploader_email: string;
  uploader_name: string;
}

export interface UploadHistoryResponse {
  company_id: string;
  history: UploadHistoryItem[];
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

/**
 * 2. Authenticate user
 * POST /api/auth/login/
 */
export async function loginUser(credentials: { email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Unable to authenticate. Please check your credentials.");
  }

  const data: AuthResponse = await res.json();
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

/**
 * 3. Register company with auto-assigned CID
 * POST /api/auth/register/
 */
export async function registerCompany(data: {
  companyName: string;
  email: string;
  password: string;
  industry?: string;
  companySize?: string;
  fullName?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || "Company registration could not be completed.");
  }

  const resData: AuthResponse = await res.json();
  if (resData.token) {
    setAuthToken(resData.token);
  }
  return resData;
}

/**
 * 4. Get Current User & Company Identity
 * GET /api/auth/me/
 */
export async function getCurrentUser(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/auth/me/`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Session expired or unauthorized.");
  }
  return res.json();
}

/**
 * 5. Get available companies for authorized user
 * GET /api/companies/
 */
export async function getCompanies(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/companies/`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return ["C001", "C002", "C003"];
    const data = await res.json();
    return data.companies || ["C001", "C002", "C003"];
  } catch {
    return ["C001", "C002", "C003"];
  }
}

/**
 * 6. Get Company Details
 * GET /api/company/<company_id>/
 */
export async function getCompany(companyId: string): Promise<CompanyDetailsResponse> {
  const trimmedId = companyId.trim();
  const res = await fetch(`${API_BASE_URL}/company/${trimmedId}/`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(`Access Forbidden: You are not authorized to view records for company "${trimmedId}".`);
    }
    if (res.status === 404) {
      throw new Error(`Company not found: "${trimmedId}".`);
    }
    throw new Error(`Unable to connect to Smart CFO backend (${res.status}).`);
  }

  return res.json();
}

/**
 * 7. Get Company Financial Analysis
 * GET /api/company/<company_id>/analysis/
 */
export async function getCompanyAnalysis(companyId: string): Promise<CompanyAnalysisResponse> {
  const trimmedId = companyId.trim();
  const res = await fetch(`${API_BASE_URL}/company/${trimmedId}/analysis/`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(`Access Denied: You are not authorized to access financial intelligence for company "${trimmedId}".`);
    }
    if (res.status === 404) {
      throw new Error(`No financial records available for "${trimmedId}". Please upload quarterly financial CSV.`);
    }
    throw new Error(`Unable to connect to Smart CFO backend (${res.status}).`);
  }

  return res.json();
}

export interface ForecastQuarterItem {
  quarter: string;
  revenue: number;
  baseline_quarter: string;
  baseline_revenue: number;
  horizon?: number;
}

export interface HistoricalQuarterItem {
  quarter: string;
  revenue: number;
}

export interface CompanyForecastResponse {
  status: string;
  company_id: string;
  company_name: string;
  forecast_method: string;
  latest_historical_quarter: string;
  latest_revenue: number;
  latest_yoy_growth_percent: number;
  capped_growth_percent: number;
  trend: "Increasing" | "Declining" | "Stable";
  forecast_change_percent: number;
  forecast: ForecastQuarterItem[];
  historical: HistoricalQuarterItem[];
  explanation: string;
  assumptions: string;
  data_quality?: {
    historical_quarters_count: number;
    earliest_quarter: string;
    latest_quarter: string;
    has_continuous_history: boolean;
    growth_capped: boolean;
  };
}

/**
 * 8. Company Revenue Forecasting
 * GET /api/forecast/<company_id>/
 */
export async function getCompanyForecast(companyId: string): Promise<CompanyForecastResponse> {
  const trimmedId = companyId.trim();
  const res = await fetch(`${API_BASE_URL}/forecast/${trimmedId}/`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(`Access Denied: You are not authorized to access forecasts for "${trimmedId}".`);
    }
    if (res.status === 404) {
      throw new Error(`No financial records available for "${trimmedId}".`);
    }
    let errorDetail = `Forecast request failed (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
      else if (errJson.error) errorDetail = errJson.error;
    } catch {}
    throw new Error(errorDetail);
  }

  return res.json();
}

export interface CashFlowHistoricalItem {
  quarter: string;
  operating_cash_flow: number;
  cash: number;
  debt: number;
}

export interface CashFlowForecastItem {
  quarter: string;
  forecast_operating_cash_flow: number;
  baseline_quarter: string;
  baseline_operating_cash_flow: number;
  horizon: number;
}

export interface BacktestErrorMetrics {
  mae: number | null;
  rmse: number | null;
  wape_percent: number | null;
  sample_size: number;
}

export interface CashFlowBacktestEvaluation {
  origin_quarter: string;
  training_quarters_count: number;
  test_quarters: string[];
  actuals: number[];
  candidate_predictions: number[];
  baseline_predictions: number[];
  candidate_metrics: BacktestErrorMetrics;
  baseline_metrics: BacktestErrorMetrics;
  model_wins: boolean;
  trend_delta_annual: number;
}

export interface CashFlowForecastResponse {
  status: string;
  company_id: string;
  company_name: string;
  forecast_method: string;
  baseline_method: string;
  unit: string;
  latest_historical_quarter: string;
  latest_operating_cash_flow: number;
  full_history_trend_delta: number;
  backtest_evaluation: CashFlowBacktestEvaluation;
  forecast: CashFlowForecastItem[];
  historical: CashFlowHistoricalItem[];
  explanation: string;
  assumptions: string;
  data_quality?: {
    historical_quarters_count: number;
    earliest_quarter: string;
    latest_quarter: string;
    has_negative_cash_flow: boolean;
    negative_quarters_count: number;
  };
}

/**
 * 9. Cash Flow Forecasting
 * GET /api/forecast/cash-flow/<company_id>/
 */
export async function getCompanyCashFlowForecast(companyId: string): Promise<CashFlowForecastResponse> {
  const trimmedId = companyId.trim();
  const res = await fetch(`${API_BASE_URL}/forecast/cash-flow/${trimmedId}/`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(`Access Denied: You are not authorized to view cash flow forecasts for "${trimmedId}".`);
    }
    if (res.status === 404) {
      throw new Error(`No cash flow records available for "${trimmedId}".`);
    }
    let errorDetail = `Cash flow forecast request failed (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
      else if (errJson.error) errorDetail = errJson.error;
    } catch {}
    throw new Error(errorDetail);
  }

  return res.json();
}

// ============================================================
// CSV VALIDATION, DOWNLOAD & INGESTION SERVICES
// ============================================================

export function getCSVTemplateDownloadUrl(): string {
  const token = getAuthToken();
  return `${API_BASE_URL}/csv/template/${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export async function validateFinancialCSV(fileOrText: File | string): Promise<CSVValidationResponse> {
  const token = getAuthToken();
  let headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit;
  if (fileOrText instanceof File) {
    const formData = new FormData();
    formData.append("file", fileOrText);
    body = formData;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ content: fileOrText });
  }

  const res = await fetch(`${API_BASE_URL}/csv/validate/`, {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Validation error (${res.status})`);
  }
  return res.json();
}

export async function importFinancialCSV(fileOrText: File | string, filename?: string): Promise<CSVImportResponse> {
  const token = getAuthToken();
  let headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit;
  if (fileOrText instanceof File) {
    const formData = new FormData();
    formData.append("file", fileOrText);
    body = formData;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ content: fileOrText, filename: filename || "statement.csv" });
  }

  const res = await fetch(`${API_BASE_URL}/csv/import/`, {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `Import rejected (${res.status})`);
  }
  return res.json();
}

export async function getUploadHistory(): Promise<UploadHistoryResponse> {
  const res = await fetch(`${API_BASE_URL}/csv/history/`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to load upload history (${res.status}).`);
  }
  return res.json();
}

// ============================================================
// ANOMALY DETECTION METHODS
// ============================================================

export interface AnomalyCompanyInfo {
  company_id: string;
  company_name: string;
  industry: string;
  company_size: string;
}

export interface AnomalySummary {
  total_records: number;
  flagged_anomalies: number;
  normal_records: number;
  anomaly_percentage: number;
  last_scan_time: string;
}

export interface AnomalyContributorItem {
  feature_key: string;
  feature_label: string;
  unit: string;
  category: string;
  actual_value: number;
  previous_value: number | null;
  historical_median: number;
  absolute_diff: number;
  percent_diff: number;
  deviation_severity: number;
  is_unusual: boolean;
}

export interface AnomalyRecordItem {
  record_id: number;
  company_id: string;
  quarter: string;
  is_anomaly: boolean;
  anomaly_status: "ANOMALY PRESENT" | "No Anomaly Detected";
  decision_score: number;
  is_reviewed: boolean;
  explanation: string;
  top_contributors: AnomalyContributorItem[];
  unusual_parameters?: AnomalyContributorItem[];
  metrics: Record<string, number>;
  all_deviations: AnomalyContributorItem[];
}

export interface AnomalyChartSeriesPoint {
  quarter: string;
  value: number;
  is_anomaly: boolean;
  is_parameter_unusual?: boolean;
  record_id: number;
  decision_score: number;
}

export interface AnomalyChartItem {
  key: string;
  title: string;
  unit: string;
  category: string;
  has_parameter_anomalies?: boolean;
  metric_status?: "normal" | "unusual" | "review";
  series: AnomalyChartSeriesPoint[];
}

export interface ParameterSummary {
  total_evaluated_parameters: number;
  normal_count: number;
  normal_percentage: number;
  unusual_count: number;
  unusual_percentage: number;
}

export interface MetricsSummary {
  total_metrics: number;
  normal_metrics_count: number;
  normal_metrics_percentage: number;
  unusual_metrics_count: number;
  unusual_metrics_percentage: number;
  review_metrics_count: number;
  review_metrics_percentage: number;
  metric_classifications?: Record<string, string>;
}

export interface AnomalyOverviewResponse {
  company_info: AnomalyCompanyInfo;
  summary: AnomalySummary;
  parameter_summary: ParameterSummary;
  metrics_summary: MetricsSummary;
  records: AnomalyRecordItem[];
  charts_data: Record<string, AnomalyChartItem>;
  insufficient_data?: boolean;
  message?: string;
}

export interface ParameterAnomalyDetailItem extends AnomalyContributorItem {
  status: string;
  parameter_explanation: string;
}

export interface ParameterAnomalyDetailResponse {
  company_info: AnomalyCompanyInfo;
  quarter: string;
  record_id: number;
  is_quarter_anomaly: boolean;
  decision_score: number;
  is_reviewed: boolean;
  parameter: ParameterAnomalyDetailItem;
  historical_trend: AnomalyChartItem;
  summary: AnomalySummary;
}

export async function getAnomalyOverview(companyId: string): Promise<AnomalyOverviewResponse> {
  const cleanId = companyId.trim().toUpperCase();
  const res = await fetch(`${API_BASE_URL}/anomaly-detection/overview/?company_id=${cleanId}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(`Access Denied: You are not authorized to view anomaly scans for "${cleanId}".`);
    }
    throw new Error(`Failed to load anomaly detection data for "${cleanId}" (${res.status}).`);
  }

  return res.json();
}

export async function scanAnomalies(companyId: string): Promise<AnomalyOverviewResponse> {
  const cleanId = companyId.trim().toUpperCase();
  const res = await fetch(`${API_BASE_URL}/anomaly-detection/scan/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ company_id: cleanId }),
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(`Access Denied: You are not authorized to trigger anomaly scans for "${cleanId}".`);
    }
    throw new Error(`Anomaly detection scan failed for "${cleanId}" (${res.status}).`);
  }

  return res.json();
}

export async function getAnomalyDetail(
  recordId: number | string,
  featureKey?: string
): Promise<ParameterAnomalyDetailResponse> {
  const query = featureKey ? `?feature_key=${encodeURIComponent(featureKey)}` : "";
  const res = await fetch(`${API_BASE_URL}/anomaly-detection/detail/${recordId}/${query}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Anomaly record ID #${recordId} not found.`);
    }
    throw new Error(`Failed to fetch parameter anomaly details (${res.status}).`);
  }

  return res.json();
}

export async function markAnomalyReviewed(
  recordId: number | string,
  reviewed: boolean
): Promise<{ success: boolean; record_id: number; reviewed: boolean }> {
  const res = await fetch(`${API_BASE_URL}/anomaly-detection/review/${recordId}/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ reviewed }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update review status for record #${recordId}.`);
  }

  return res.json();
}
