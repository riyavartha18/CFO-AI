# SMART CFO

Smart CFO is an enterprise financial risk intelligence system combining Machine Learning risk classification, expert rule engine reasoning (forward and backward chaining), and financial data validation for multi-company financial analysis.

---

## Architecture Overview

```
SMART-CFO/
│
├── frontend/                     # Next.js / React user interface (future phase)
│
├── backend/                      # Backend engine & API services
│   ├── rules/                    # Production expert rule engine
│   │   ├── __init__.py           # Rule engine package exports
│   │   └── cfo_rules.py          # 10 production financial rules + forward/backward chaining
│   ├── .env                      # Environment configuration (Supabase / DB credentials - private)
│   ├── test_prediction.py        # Dynamic company financial analysis (Supabase -> Features -> ML + Rules)
│   └── validate_csv.py           # Financial statement CSV schema and integrity validation
│
├── ml/                           # Machine Learning assets and pipelines
│   ├── models/                   # Serialized production models
│   │   ├── cfo_risk_model.pkl    # Trained RandomForest risk classifier
│   │   └── cfo_feature_columns.pkl # Ordered list of 15 engineered features
│   ├── training/                 # Model training scripts and pipelines
│   ├── dataset/                  # Curated ML datasets and ground truth
│   └── notebooks/                # Jupyter research and exploratory analysis
│
├── data/                         # CSV and dataset storage
│   ├── templates/                # Standardized financial CSV upload templates
│   └── sample/                   # Sample company financial files for testing
│
├── .gitignore                    # Version control ignore rules
└── README.md                     # Project documentation and system guide
```

---

## Core Components

### 1. Backend (`backend/`)
- **Dynamic Company Analysis (`backend/test_prediction.py`)**:
  - Connects to Supabase PostgreSQL database.
  - Queries historical financial statements dynamically for any company identifier (e.g., `C001`, `C002`, `ABC123`, `COMP-2026-01`).
  - Computes derived financial metrics (EBITDA, EBIT, Net Profit, Current Assets, Current Liabilities, Total Debt, Total Liabilities, Total Assets, Equity).
  - Computes 15 ML feature ratios and growth rates.
  - Loads production ML model from `ml/models/` and generates risk classifications and probabilities.
  - Executes forward chaining to identify triggered financial risks and backward chaining to provide human-readable root-cause explanations.
- **CSV Validation (`backend/validate_csv.py`)**:
  - Validates company quarterly financial CSVs before database ingestion.
  - Checks for required columns, extra columns, null values, single-company consistency, duplicate quarters, valid `YYYYQ[1-4]` quarter formats, numeric data integrity, and non-negative revenue.
- **Rule Engine (`backend/rules/cfo_rules.py`)**:
  - Encapsulates 10 domain rules evaluating Liquidity, Debt-to-Equity, Interest Coverage, Profitability, Operating Cash Flow, Revenue Growth, and Profit Growth.
  - `forward_chaining(financial_data)`: Identifies all active financial risks.
  - `backward_chaining(financial_data, target)`: Explains why specific risks were flagged using threshold telemetry.

### 2. Machine Learning (`ml/`)
- **`ml/models/cfo_risk_model.pkl`**: Serialized scikit-learn classification model for enterprise financial risk prediction.
- **`ml/models/cfo_feature_columns.pkl`**: Ordered feature definitions ensuring 100% alignment between training and inference:
  1. `profit_margin`
  2. `roa`
  3. `roe`
  4. `current_ratio`
  5. `quick_ratio`
  6. `debt_to_equity`
  7. `debt_to_assets`
  8. `interest_coverage`
  9. `cash_to_debt`
  10. `operating_cash_flow_ratio`
  11. `asset_turnover`
  12. `inventory_turnover`
  13. `revenue_growth`
  14. `profit_growth`
  15. `cash_flow_growth`

### 3. Data (`data/`)
- **`data/templates/`**: Reference CSV column formats and guidelines for new uploads.
- **`data/sample/`**: Sample test files for batch validation and local testing.

### 4. Frontend (`frontend/`)
- Placeholder for upcoming Next.js web application for CFO dashboards, file uploads, risk visualization, and automated executive reporting.

---

## Quickstart & Verification

### Running Company Financial Analysis
From the project root:
```bash
python -c "import sys; sys.path.insert(0, 'backend'); from test_prediction import analyze_company; analyze_company('C001')"
```
Or interactively from the backend directory:
```bash
cd backend
python test_prediction.py
```
*(Enter any valid company ID such as `C001`, `C002`, etc. when prompted)*

### Running CSV Validation
```bash
cd backend
python validate_csv.py
```

### Running Rule Engine Standalone Test
```bash
python backend/rules/cfo_rules.py
```
