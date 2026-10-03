// ============================================================
// SMART CFO - MOCK UI DATA (Separated from Components)
// Used exclusively for UI layout and preview purposes.
// No calculation or business logic is implemented here.
// ============================================================

export interface MetricSummary {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtext?: string;
}

export const mockDashboardData = {
  companyId: "C001",
  companyName: "Nexus Dynamics Corp.",
  latestQuarter: "2026Q4",
  healthScore: 86,
  healthStatus: "Strong",
  riskLevel: "Low Risk" as const,
  riskProbabilities: {
    low: 94.2,
    medium: 5.1,
    high: 0.7,
  },
  metrics: {
    revenue: {
      label: "Total Revenue",
      value: "₹142.8 Cr",
      change: "+12.4%",
      isPositive: true,
      subtext: "vs. previous quarter",
    },
    netProfit: {
      label: "Net Profit",
      value: "₹26.4 Cr",
      change: "+8.2%",
      isPositive: true,
      subtext: "Margin: 18.5%",
    },
    cashReserve: {
      label: "Cash & Equivalents",
      value: "₹41.5 Cr",
      change: "+5.1%",
      isPositive: true,
      subtext: "Cash-to-Debt: 1.82x",
    },
    totalDebt: {
      label: "Total Debt",
      value: "₹22.8 Cr",
      change: "-4.3%",
      isPositive: true,
      subtext: "D/E Ratio: 0.38",
    },
  },
  quarterlyTrends: [
    { quarter: "2025Q1", revenue: 110.2, netProfit: 18.4, cash: 32.1, debt: 27.0, riskScore: 28 },
    { quarter: "2025Q2", revenue: 118.6, netProfit: 20.1, cash: 34.5, debt: 26.2, riskScore: 24 },
    { quarter: "2025Q3", revenue: 124.0, netProfit: 21.8, cash: 36.0, debt: 25.4, riskScore: 22 },
    { quarter: "2025Q4", revenue: 129.5, netProfit: 23.2, cash: 37.8, debt: 24.8, riskScore: 20 },
    { quarter: "2026Q1", revenue: 131.0, netProfit: 22.4, cash: 38.2, debt: 24.0, riskScore: 25 },
    { quarter: "2026Q2", revenue: 135.4, netProfit: 24.0, cash: 39.5, debt: 23.5, riskScore: 19 },
    { quarter: "2026Q3", revenue: 139.2, netProfit: 25.1, cash: 40.2, debt: 23.1, riskScore: 18 },
    { quarter: "2026Q4", revenue: 142.8, netProfit: 26.4, cash: 41.5, debt: 22.8, riskScore: 16 },
  ],
  keyInsights: [
    {
      id: "1",
      title: "Solvency Runway Healthy",
      description: "Operating cash flow comfortably covers current liabilities with a ratio of 1.48x.",
      type: "positive" as const,
    },
    {
      id: "2",
      title: "Deleveraging Trajectory",
      description: "Debt-to-Equity reduced from 0.52 to 0.38 over the last 4 quarters.",
      type: "positive" as const,
    },
    {
      id: "3",
      title: "Inventory Turnover Moderating",
      description: "Inventory cycle extended slightly by 4 days in Q4; monitor supply chain pipeline.",
      type: "warning" as const,
    },
  ],
};

export const mockFinancialAnalysis = {
  quarter: "2026Q4",
  incomeStatement: [
    { item: "Total Revenue", amount: "₹142.80 Cr", percentage: "100.0%" },
    { item: "Cost of Goods Sold (COGS)", amount: "₹68.50 Cr", percentage: "48.0%" },
    { item: "Gross Profit", amount: "₹74.30 Cr", percentage: "52.0%" },
    { item: "Operating Expenses", amount: "₹38.20 Cr", percentage: "26.8%" },
    { item: "EBITDA", amount: "₹36.10 Cr", percentage: "25.3%" },
    { item: "Depreciation & Amortization", amount: "₹5.40 Cr", percentage: "3.8%" },
    { item: "EBIT (Operating Income)", amount: "₹30.70 Cr", percentage: "21.5%" },
    { item: "Interest Expense", amount: "₹1.80 Cr", percentage: "1.3%" },
    { item: "Tax Expense", amount: "₹2.50 Cr", percentage: "1.8%" },
    { item: "Net Profit (PAT)", amount: "₹26.40 Cr", percentage: "18.5%" },
  ],
  balanceSheet: [
    { item: "Cash & Bank Balance", amount: "₹41.50 Cr", category: "Current Assets" },
    { item: "Accounts Receivable", amount: "₹24.80 Cr", category: "Current Assets" },
    { item: "Inventory", amount: "₹19.20 Cr", category: "Current Assets" },
    { item: "Fixed Assets (PP&E)", amount: "₹58.60 Cr", category: "Non-Current Assets" },
    { item: "Total Assets", amount: "₹144.10 Cr", category: "Assets Total" },
    { item: "Accounts Payable", amount: "₹16.40 Cr", category: "Current Liabilities" },
    { item: "Short-Term Debt", amount: "₹6.20 Cr", category: "Current Liabilities" },
    { item: "Long-Term Debt", amount: "₹16.60 Cr", category: "Non-Current Liabilities" },
    { item: "Total Liabilities", amount: "₹45.70 Cr", category: "Liabilities Total" },
    { item: "Shareholders Equity", amount: "₹98.40 Cr", category: "Equity Total" },
  ],
  cashFlow: [
    { item: "Operating Cash Flow (OCF)", amount: "₹31.20 Cr", status: "Healthy" },
    { item: "Investing Cash Flow (ICF)", amount: "-₹8.50 Cr", status: "Capital Expansion" },
    { item: "Financing Cash Flow (FCF)", amount: "-₹6.20 Cr", status: "Debt Paydown" },
    { item: "Net Change in Cash", amount: "+₹16.50 Cr", status: "Positive Net Flow" },
  ],
  ratios: [
    { name: "Profit Margin", value: "18.5%", benchmark: "> 10%", status: "Good" },
    { name: "Current Ratio", value: "2.12x", benchmark: "> 1.50x", status: "Good" },
    { name: "Quick Ratio", value: "1.65x", benchmark: "> 1.00x", status: "Good" },
    { name: "Debt-to-Equity", value: "0.38x", benchmark: "< 1.50x", status: "Good" },
    { name: "Interest Coverage", value: "17.06x", benchmark: "> 3.00x", status: "Excellent" },
    { name: "Return on Assets (ROA)", value: "18.3%", benchmark: "> 8%", status: "Good" },
    { name: "Return on Equity (ROE)", value: "26.8%", benchmark: "> 15%", status: "Excellent" },
    { name: "Asset Turnover", value: "0.99x", benchmark: "> 0.80x", status: "Normal" },
  ],
};

export const mockRiskAnalysis = {
  overallRisk: "Low Risk" as const,
  overallRiskScore: 16,
  riskProbabilities: [
    { name: "Low Risk", probability: 94.2, color: "#10b981" },
    { name: "Medium Risk", probability: 5.1, color: "#f59e0b" },
    { name: "High Risk", probability: 0.7, color: "#ef4444" },
  ],
  detectedRisks: [
    {
      id: "R-01",
      risk: "Working Capital Buffer Sensitivity",
      severity: "Low" as const,
      ruleTrigger: "Quick Ratio within optimal bounds but receivable cycle lengthened by 3 days.",
      explanation: "Receivable days shifted from 52 to 55 days; current cash cushion of ₹41.5 Cr mitigates any liquidity impact.",
      recommendation: "Tighten credit terms with tier-2 distributor accounts to preserve cash conversion cycle.",
    },
    {
      id: "R-02",
      risk: "CapEx Cash Drag",
      severity: "Low" as const,
      ruleTrigger: "Investing cash outflow increased due to automated machinery acquisition.",
      explanation: "₹8.5 Cr invested in Q4 infrastructure. Fully funded via internal accruals with zero debt addition.",
      recommendation: "Track projected ROI over the next 3 quarters to verify anticipated 12% operational yield boost.",
    },
  ],
  historicalRiskTrend: [
    { quarter: "2025Q1", riskLevel: "Medium Risk", score: 48 },
    { quarter: "2025Q2", riskLevel: "Medium Risk", score: 42 },
    { quarter: "2025Q3", riskLevel: "Low Risk", score: 32 },
    { quarter: "2025Q4", riskLevel: "Low Risk", score: 26 },
    { quarter: "2026Q1", riskLevel: "Low Risk", score: 24 },
    { quarter: "2026Q2", riskLevel: "Low Risk", score: 20 },
    { quarter: "2026Q3", riskLevel: "Low Risk", score: 18 },
    { quarter: "2026Q4", riskLevel: "Low Risk", score: 16 },
  ],
};

export const mockForecastData = [
  { quarter: "2026Q1", actualRev: 131.0, forecastRev: 131.0, actualProfit: 22.4, forecastProfit: 22.4, cashFlow: 28.5 },
  { quarter: "2026Q2", actualRev: 135.4, forecastRev: 135.4, actualProfit: 24.0, forecastProfit: 24.0, cashFlow: 29.8 },
  { quarter: "2026Q3", actualRev: 139.2, forecastRev: 139.2, actualProfit: 25.1, forecastProfit: 25.1, cashFlow: 30.6 },
  { quarter: "2026Q4", actualRev: 142.8, forecastRev: 142.8, actualProfit: 26.4, forecastProfit: 26.4, cashFlow: 31.2 },
  { quarter: "2027Q1 (Proj)", forecastRev: 148.5, forecastProfit: 28.1, cashFlow: 32.8 },
  { quarter: "2027Q2 (Proj)", forecastRev: 154.2, forecastProfit: 29.8, cashFlow: 34.5 },
  { quarter: "2027Q3 (Proj)", forecastRev: 160.0, forecastProfit: 31.5, cashFlow: 36.2 },
  { quarter: "2027Q4 (Proj)", forecastRev: 166.5, forecastProfit: 33.2, cashFlow: 38.0 },
];

export const mockCompanies = [
  { id: "C001", name: "Nexus Dynamics (Primary)", industry: "Industrial Tech", revenue: 142.8, profit: 26.4, health: 86, risk: "Low Risk", debt: 22.8, liquidity: 2.12 },
  { id: "C002", name: "Apex Retail Chains", industry: "Retail & FMCG", revenue: 210.5, profit: 14.2, health: 68, risk: "Medium Risk", debt: 84.0, liquidity: 1.25 },
  { id: "ABC123", name: "Alpha BioPharma", industry: "Healthcare", revenue: 98.4, profit: 21.0, health: 82, risk: "Low Risk", debt: 15.2, liquidity: 2.45 },
  { id: "COMP-2026-01", name: "Vanguard Logistics", industry: "Supply Chain", revenue: 175.2, profit: 8.5, health: 54, risk: "High Risk", debt: 110.0, liquidity: 0.92 },
];

export const mockChatQuestions = [
  "What is our projected cash runway for the next 12 months?",
  "How will an 8% increase in raw material costs impact our EBITDA margin?",
  "Explain why our debt-to-equity improved in the latest quarter.",
  "Which financial risk category requires our most immediate attention?",
];

export const mockInitialMessages = [
  {
    id: "m-1",
    sender: "cfo" as const,
    text: "Hello! I am your Smart CFO AI assistant. Ask me questions regarding company solvency, margins, cash forecasts, or what-if projections.",
    timestamp: "Just now",
  },
];
