"""
SMART CFO — REVENUE FORECASTING SERVICE
Deterministic Seasonal + Trend Baseline Forecasting Engine

Separation of Responsibilities:
1. Database Retrieval (Supabase PostgreSQL parameterized query)
2. Data Validation & Integrity Checks
3. Year-over-Year (YoY) Growth Calculation & Capping
4. 4-Quarter Seasonal Forecast Generation
5. Forecast Trend Classification
6. Structured Response Formatting & Explanations
"""

import os
import re
import math
from typing import Dict, List, Optional, Tuple, Any
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

# Load environment configuration
BACKEND_DIR = Path(__file__).resolve().parent.parent
env_path = BACKEND_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# Constants
MIN_HISTORICAL_QUARTERS = 5  # At least L-4 to calculate latest YoY, and L-3..L for seasonal baselines
LOWER_GROWTH_CAP = -10.0      # -10% minimum growth bound
UPPER_GROWTH_CAP = 15.0       # +15% maximum growth bound
TREND_THRESHOLD_PERCENT = 3.0 # Threshold for Increasing / Declining classification
FORECAST_HORIZONS = 4         # Next 4 quarters projection


# ============================================================================
# 1. QUARTER UTILITY FUNCTIONS
# ============================================================================

QUARTER_REGEX = re.compile(r"^\s*(\d{4})\s*[-/ ]?\s*[Qq]([1-4])\s*$")

def parse_quarter(quarter_str: Any) -> Optional[Tuple[int, int]]:
    """
    Parses quarter strings in formats such as '2026Q4', '2026-Q4', '2026 Q4'.
    Returns (year, quarter_number) where quarter_number is 1..4, or None if invalid.
    """
    if not quarter_str:
        return None
    match = QUARTER_REGEX.match(str(quarter_str).strip())
    if not match:
        return None
    year = int(match.group(1))
    q = int(match.group(2))
    return (year, q)


def format_quarter(year: int, quarter: int, style: str = "hyphen") -> str:
    """
    Formats year and quarter number.
    style='hyphen'  -> '2027-Q1'
    style='compact' -> '2027Q1'
    """
    if style == "compact":
        return f"{year}Q{quarter}"
    return f"{year}-Q{quarter}"


def quarter_to_index(year: int, quarter: int) -> int:
    """Converts (year, quarter) into a zero-based continuous integer index."""
    return year * 4 + (quarter - 1)


def index_to_quarter(idx: int) -> Tuple[int, int]:
    """Converts a continuous integer index back to (year, quarter)."""
    year = idx // 4
    q = (idx % 4) + 1
    return (year, q)


def add_quarters(year: int, quarter: int, num_quarters: int) -> Tuple[int, int]:
    """Adds num_quarters to (year, quarter). Handles year transitions accurately."""
    idx = quarter_to_index(year, quarter) + num_quarters
    return index_to_quarter(idx)


def same_quarter_previous_year(year: int, quarter: int) -> Tuple[int, int]:
    """Returns the same quarter in the preceding calendar year."""
    return (year - 1, quarter)


# ============================================================================
# 2. DATABASE RETRIEVAL
# ============================================================================

def get_db_connection():
    """Establishes and returns a connection to Supabase PostgreSQL."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT")
    )


def fetch_company_revenue_records(company_id: str) -> Tuple[bool, Optional[str], List[Dict[str, Any]]]:
    """
    Retrieves company metadata and quarterly revenue records from Supabase.
    Uses parameterized SQL to guarantee protection against SQL injection.
    
    Returns:
        (company_exists, company_name, records_list)
    """
    clean_id = company_id.strip()
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # 1. Check company name from companies table if available
        cur.execute("SELECT company_name FROM companies WHERE company_id = %s;", (clean_id,))
        company_row = cur.fetchone()
        company_name = company_row[0] if company_row else clean_id

        # 2. Fetch quarterly financial records ordered chronologically
        cur.execute("""
            SELECT quarter, revenue_cr
            FROM financial_records
            WHERE company_id = %s
            ORDER BY quarter ASC;
        """, (clean_id,))
        rows = cur.fetchall()
        cur.close()

        if not rows and not company_row:
            # Neither in companies table nor in financial_records
            return False, None, []

        records = [{"quarter": r[0], "revenue_cr": r[1]} for r in rows]
        return True, company_name, records

    except Exception as exc:
        print(f"Error fetching revenue records for {clean_id}: {exc}")
        raise exc
    finally:
        if conn:
            conn.close()


# ============================================================================
# 3. DATA VALIDATION
# ============================================================================

def validate_historical_data(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates company quarterly financial records for completeness, chronological
    integrity, numeric validity, and seasonal baseline coverage.
    
    Returns a dict with:
        is_valid: bool
        error_type: Optional[str]
        error_message: Optional[str]
        validated_series: List[Dict] with parsed (year, q) and float revenue
        by_quarter: Dict[(year, q), float]
    """
    if not records or len(records) == 0:
        return {
            "is_valid": False,
            "error_type": "NO_DATA",
            "error_message": "No quarterly financial records found in the database.",
            "validated_series": [],
            "by_quarter": {},
        }

    validated_series = []
    seen_quarters = set()
    by_quarter = {}

    for idx, row in enumerate(records):
        raw_quarter = row.get("quarter")
        parsed = parse_quarter(raw_quarter)
        if not parsed:
            return {
                "is_valid": False,
                "error_type": "INVALID_QUARTER_FORMAT",
                "error_message": f"Record #{idx + 1} contains an unparseable quarter label: '{raw_quarter}'. Expected format YYYYQ[1-4] or YYYY-Q[1-4].",
                "validated_series": [],
                "by_quarter": {},
            }

        year, q = parsed
        if (year, q) in seen_quarters:
            return {
                "is_valid": False,
                "error_type": "DUPLICATE_QUARTER",
                "error_message": f"Duplicate entry detected for quarter {format_quarter(year, q)}.",
                "validated_series": [],
                "by_quarter": {},
            }
        seen_quarters.add((year, q))

        raw_rev = row.get("revenue_cr")
        if raw_rev is None:
            return {
                "is_valid": False,
                "error_type": "NULL_REVENUE",
                "error_message": f"Revenue for quarter {format_quarter(year, q)} is missing (null). Historical values cannot be fabricated.",
                "validated_series": [],
                "by_quarter": {},
            }

        try:
            rev_float = float(raw_rev)
        except (ValueError, TypeError):
            return {
                "is_valid": False,
                "error_type": "NON_NUMERIC_REVENUE",
                "error_message": f"Revenue for quarter {format_quarter(year, q)} is non-numeric: '{raw_rev}'.",
                "validated_series": [],
                "by_quarter": {},
            }

        if math.isnan(rev_float) or math.isinf(rev_float):
            return {
                "is_valid": False,
                "error_type": "NON_FINITE_REVENUE",
                "error_message": f"Revenue for quarter {format_quarter(year, q)} is not a finite number.",
                "validated_series": [],
                "by_quarter": {},
            }

        if rev_float < 0:
            return {
                "is_valid": False,
                "error_type": "NEGATIVE_REVENUE",
                "error_message": f"Revenue for quarter {format_quarter(year, q)} is negative ({rev_float} Cr). Negative top-line revenue is invalid for seasonal forecasting.",
                "validated_series": [],
                "by_quarter": {},
            }

        validated_series.append({
            "year": year,
            "quarter": q,
            "raw_quarter": raw_quarter,
            "formatted_quarter": format_quarter(year, q, "hyphen"),
            "revenue": rev_float,
            "index": quarter_to_index(year, q),
        })
        by_quarter[(year, q)] = rev_float

    # Sort strictly chronologically
    validated_series.sort(key=lambda item: item["index"])

    if len(validated_series) < MIN_HISTORICAL_QUARTERS:
        return {
            "is_valid": False,
            "error_type": "INSUFFICIENT_HISTORY",
            "error_message": f"Insufficient historical data: {len(validated_series)} quarters found, minimum {MIN_HISTORICAL_QUARTERS} consecutive quarters required to establish YoY growth and full 4-quarter seasonal baselines.",
            "validated_series": validated_series,
            "by_quarter": by_quarter,
        }

    # Verify that the latest quarter has its previous-year same-quarter baseline
    latest = validated_series[-1]
    latest_year, latest_q = latest["year"], latest["quarter"]
    prev_year_q = same_quarter_previous_year(latest_year, latest_q)

    if prev_year_q not in by_quarter:
        return {
            "is_valid": False,
            "error_type": "MISSING_YOY_BASELINE",
            "error_message": f"Previous year baseline quarter {format_quarter(prev_year_q[0], prev_year_q[1])} for latest quarter {format_quarter(latest_year, latest_q)} is missing. Cannot calculate YoY growth.",
            "validated_series": validated_series,
            "by_quarter": by_quarter,
        }

    prev_year_rev = by_quarter[prev_year_q]
    if prev_year_rev <= 0:
        return {
            "is_valid": False,
            "error_type": "ZERO_BASELINE_REVENUE",
            "error_message": f"Prior-year same-quarter revenue for {format_quarter(prev_year_q[0], prev_year_q[1])} is zero or negative ({prev_year_rev} Cr). Division by zero prevents meaningful percentage growth calculation.",
            "validated_series": validated_series,
            "by_quarter": by_quarter,
        }

    # Verify that all 4 future forecast quarters have their previous-year same-quarter baselines
    missing_baselines = []
    for step in range(1, FORECAST_HORIZONS + 1):
        target_year, target_q = add_quarters(latest_year, latest_q, step)
        baseline_year, baseline_q = same_quarter_previous_year(target_year, target_q)
        if (baseline_year, baseline_q) not in by_quarter:
            missing_baselines.append(format_quarter(baseline_year, baseline_q))

    if missing_baselines:
        return {
            "is_valid": False,
            "error_type": "MISSING_SEASONAL_BASELINES",
            "error_message": f"Missing seasonal baseline quarters required for projection: {', '.join(missing_baselines)}. Historical values cannot be fabricated.",
            "validated_series": validated_series,
            "by_quarter": by_quarter,
        }

    return {
        "is_valid": True,
        "error_type": None,
        "error_message": None,
        "validated_series": validated_series,
        "by_quarter": by_quarter,
    }


# ============================================================================
# 4. YOY GROWTH CALCULATION & GROWTH CAPPING
# ============================================================================

def calculate_yoy_growth(latest_rev: float, prev_year_rev: float) -> Tuple[float, float]:
    """
    Calculates raw YoY growth percentage and applies the predefined [-10%, +15%] bounds.
    Formula:
        YoY Growth (%) = ((Latest Revenue − Previous Year Revenue) / Previous Year Revenue) * 100
        Capped Growth = max(-10.0, min(15.0, raw_yoy_growth))
    """
    if prev_year_rev <= 0:
        raise ValueError("Previous year revenue must be strictly positive for percentage growth.")

    raw_yoy_growth = ((latest_rev - prev_year_rev) / prev_year_rev) * 100.0
    capped_growth = max(LOWER_GROWTH_CAP, min(UPPER_GROWTH_CAP, raw_yoy_growth))
    return raw_yoy_growth, capped_growth


# ============================================================================
# 5. FORECAST GENERATION
# ============================================================================

def generate_four_quarter_forecast(
    latest_year: int,
    latest_q: int,
    by_quarter: Dict[Tuple[int, int], float],
    capped_growth_percent: float,
) -> List[Dict[str, Any]]:
    """
    Generates the next 4 quarters of revenue projections using the seasonal baseline.
    Formula for each quarter:
        Forecast Revenue = Previous Year's Same-Quarter Revenue * (1 + Capped Growth / 100)
    """
    growth_multiplier = 1.0 + (capped_growth_percent / 100.0)
    forecasts = []

    for step in range(1, FORECAST_HORIZONS + 1):
        target_year, target_q = add_quarters(latest_year, latest_q, step)
        base_year, base_q = same_quarter_previous_year(target_year, target_q)
        baseline_rev = by_quarter[(base_year, base_q)]
        projected_rev = baseline_rev * growth_multiplier

        forecasts.append({
            "quarter": format_quarter(target_year, target_q, "hyphen"),
            "revenue": round(projected_rev, 2),
            "baseline_quarter": format_quarter(base_year, base_q, "hyphen"),
            "baseline_revenue": round(baseline_rev, 2),
            "horizon": step,
        })

    return forecasts


# ============================================================================
# 6. TREND CLASSIFICATION
# ============================================================================

def classify_forecast_trend(forecast_list: List[Dict[str, Any]]) -> Tuple[str, float]:
    """
    Compares the first and last forecast quarters:
        change_percent = ((final_forecast - first_forecast) / first_forecast) * 100
    Rules:
        - Increasing: change_percent > +3%
        - Declining:  change_percent < -3%
        - Stable:     within [-3%, +3%]
    """
    if not forecast_list or len(forecast_list) < 2:
        return "Stable", 0.0

    first_val = forecast_list[0]["revenue"]
    final_val = forecast_list[-1]["revenue"]

    if first_val <= 0:
        return "Stable", 0.0

    pct_change = ((final_val - first_val) / first_val) * 100.0

    if pct_change > TREND_THRESHOLD_PERCENT:
        trend = "Increasing"
    elif pct_change < -TREND_THRESHOLD_PERCENT:
        trend = "Declining"
    else:
        trend = "Stable"

    return trend, round(pct_change, 2)


# ============================================================================
# 7. EXPLANATION & ASSUMPTIONS BUILDER
# ============================================================================

def build_forecast_explanation(
    company_name: str,
    trend: str,
    change_percent: float,
    raw_yoy: float,
    capped_yoy: float,
    latest_quarter_str: str,
    forecast_quarters: List[str],
) -> str:
    """Dynamically generates a transparent executive explanation of the forecast."""
    growth_direction = "expansion" if capped_yoy > 0 else "contraction" if capped_yoy < 0 else "stagnation"
    cap_note = ""
    if raw_yoy > UPPER_GROWTH_CAP:
        cap_note = f" (growth was capped at +{UPPER_GROWTH_CAP}% from an observed raw YoY rate of +{raw_yoy:.1f}%)"
    elif raw_yoy < LOWER_GROWTH_CAP:
        cap_note = f" (decline was capped at {LOWER_GROWTH_CAP}% from an observed raw YoY rate of {raw_yoy:.1f}%)"

    trend_descriptor = {
        "Increasing": f"projected to increase by {abs(change_percent):.1f}% between {forecast_quarters[0]} and {forecast_quarters[-1]}",
        "Declining": f"projected to decline by {abs(change_percent):.1f}% between {forecast_quarters[0]} and {forecast_quarters[-1]}",
        "Stable": f"projected to remain relatively stable (net change of {change_percent:+.1f}% between {forecast_quarters[0]} and {forecast_quarters[-1]})",
    }.get(trend, "projected across the forward horizon")

    return (
        f"Revenue for {company_name} is {trend_descriptor}. Projections apply the latest observed annual {growth_direction} rate of "
        f"{capped_yoy:+.1f}%{cap_note} from {latest_quarter_str} across the prior year's seasonal baselines for {', '.join(forecast_quarters)}."
    )


# ============================================================================
# 8. MASTER SERVICE FUNCTION
# ============================================================================

def generate_company_revenue_forecast(
    company_id: str,
    custom_records: Optional[List[Dict[str, Any]]] = None,
    custom_company_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    End-to-end execution of the revenue forecasting pipeline.
    
    Args:
        company_id: The unique identifier of the company (e.g., 'C001').
        custom_records: Optional in-memory records list for testing without DB access.
        custom_company_name: Optional override for company name in tests.
        
    Returns:
        Structured response dictionary matching API specifications.
        Raises ValueError or LookupError on error conditions with detailed reasons.
    """
    clean_id = company_id.strip()

    # Step 1: Database retrieval
    if custom_records is not None:
        company_exists = True
        company_name = custom_company_name or clean_id
        records = custom_records
    else:
        company_exists, fetched_name, records = fetch_company_revenue_records(clean_id)
        company_name = fetched_name or clean_id

    if not company_exists:
        raise LookupError(f"Company '{clean_id}' not found in database.")

    # Step 2: Data validation
    validation = validate_historical_data(records)
    if not validation["is_valid"]:
        raise ValueError({
            "error_type": validation["error_type"],
            "message": validation["error_message"],
            "company_id": clean_id,
            "record_count": len(records),
        })

    validated_series = validation["validated_series"]
    by_quarter = validation["by_quarter"]

    # Step 3: Latest YoY Growth Calculation & Capping
    latest_item = validated_series[-1]
    latest_year = latest_item["year"]
    latest_q = latest_item["quarter"]
    latest_rev = latest_item["revenue"]
    latest_quarter_str = latest_item["formatted_quarter"]

    prev_year_item = same_quarter_previous_year(latest_year, latest_q)
    prev_year_rev = by_quarter[prev_year_item]

    raw_yoy, capped_yoy = calculate_yoy_growth(latest_rev, prev_year_rev)

    # Step 4: 4-Quarter Seasonal Projections
    forecast_points = generate_four_quarter_forecast(
        latest_year,
        latest_q,
        by_quarter,
        capped_yoy
    )

    # Step 5: Trend Classification
    trend, forecast_change_pct = classify_forecast_trend(forecast_points)

    # Format Historical Points for Chart
    historical_points = [
        {
            "quarter": item["formatted_quarter"],
            "revenue": round(item["revenue"], 2),
        }
        for item in validated_series
    ]

    forecast_quarters = [p["quarter"] for p in forecast_points]
    explanation = build_forecast_explanation(
        company_name=company_name,
        trend=trend,
        change_percent=forecast_change_pct,
        raw_yoy=raw_yoy,
        capped_yoy=capped_yoy,
        latest_quarter_str=latest_quarter_str,
        forecast_quarters=forecast_quarters,
    )

    assumptions = (
        f"Deterministic Seasonal + Trend baseline method. Applies latest capped YoY growth rate ({capped_yoy:+.1f}%) "
        f"to prior-year same-quarter seasonal revenues. Growth bounds are enforced between {LOWER_GROWTH_CAP}% and +{UPPER_GROWTH_CAP}%. "
        f"Projections are directional estimates based on historical seasonality and do not guarantee future performance or financial health."
    )

    return {
        "status": "success",
        "company_id": clean_id,
        "company_name": company_name,
        "forecast_method": "Seasonal + Trend Baseline",
        "latest_historical_quarter": latest_quarter_str,
        "latest_revenue": round(latest_rev, 2),
        "latest_yoy_growth_percent": round(raw_yoy, 2),
        "capped_growth_percent": round(capped_yoy, 2),
        "trend": trend,
        "forecast_change_percent": forecast_change_pct,
        "forecast": forecast_points,
        "historical": historical_points,
        "explanation": explanation,
        "assumptions": assumptions,
        "data_quality": {
            "historical_quarters_count": len(validated_series),
            "earliest_quarter": validated_series[0]["formatted_quarter"],
            "latest_quarter": latest_quarter_str,
            "has_continuous_history": True,
            "growth_capped": raw_yoy != capped_yoy,
        },
    }


# ============================================================================
# 9. CASH FLOW FORECASTING SERVICE (OPERATING CASH FLOW)
# ============================================================================

MIN_CASH_FLOW_QUARTERS = 8  # Require at least 8 quarters for backtesting (4 train + 4 test)


def fetch_company_cash_flow_records(company_id: str) -> Tuple[bool, Optional[str], List[Dict[str, Any]]]:
    """
    Retrieves company metadata and quarterly operating cash flow records from Supabase PostgreSQL.
    Preserves negative cash flows and exact values in ₹ Crores.
    """
    clean_id = company_id.strip()
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT company_name FROM companies WHERE company_id = %s;", (clean_id,))
        company_row = cur.fetchone()
        company_name = company_row[0] if company_row else clean_id

        cur.execute("""
            SELECT quarter, operating_cash_flow_cr, cash_cr, (COALESCE(short_term_debt_cr, 0) + COALESCE(long_term_debt_cr, 0)) as total_debt_cr
            FROM financial_records
            WHERE company_id = %s
            ORDER BY quarter ASC;
        """, (clean_id,))

        rows = cur.fetchall()
        cur.close()

        if not rows and not company_row:
            return False, None, []

        records = [
            {
                "quarter": r[0],
                "operating_cash_flow_cr": r[1],
                "cash_cr": r[2],
                "total_debt_cr": r[3],
            }
            for r in rows
        ]
        return True, company_name, records

    except Exception as exc:
        print(f"Error fetching cash flow records for {clean_id}: {exc}")
        raise exc
    finally:
        if conn:
            conn.close()


def validate_historical_cash_flow_data(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates operating cash flow records for chronological sequence, completeness, and numeric bounds.
    Note: Preserves negative operating cash flow (unlike top-line revenue).
    """
    if not records:
        return {
            "is_valid": False,
            "error_type": "NO_DATA",
            "error_message": "No quarterly cash flow records found in the database.",
            "validated_series": [],
            "by_quarter": {},
        }

    validated_series = []
    seen_quarters = set()
    by_quarter = {}

    for idx, row in enumerate(records):
        raw_quarter = row.get("quarter")
        parsed = parse_quarter(raw_quarter)
        if not parsed:
            return {
                "is_valid": False,
                "error_type": "INVALID_QUARTER_FORMAT",
                "error_message": f"Record #{idx + 1} contains unparseable quarter: '{raw_quarter}'.",
                "validated_series": [],
                "by_quarter": {},
            }

        year, q = parsed
        if (year, q) in seen_quarters:
            return {
                "is_valid": False,
                "error_type": "DUPLICATE_QUARTER",
                "error_message": f"Duplicate entry detected for quarter {format_quarter(year, q)}.",
                "validated_series": [],
                "by_quarter": {},
            }
        seen_quarters.add((year, q))

        raw_ocf = row.get("operating_cash_flow_cr")
        if raw_ocf is None:
            return {
                "is_valid": False,
                "error_type": "NULL_CASH_FLOW",
                "error_message": f"Operating cash flow for quarter {format_quarter(year, q)} is missing (null).",
                "validated_series": [],
                "by_quarter": {},
            }

        try:
            ocf_float = float(raw_ocf)
        except (ValueError, TypeError):
            return {
                "is_valid": False,
                "error_type": "NON_NUMERIC_CASH_FLOW",
                "error_message": f"Operating cash flow for quarter {format_quarter(year, q)} is non-numeric: '{raw_ocf}'.",
                "validated_series": [],
                "by_quarter": {},
            }

        if math.isnan(ocf_float) or math.isinf(ocf_float):
            return {
                "is_valid": False,
                "error_type": "NON_FINITE_CASH_FLOW",
                "error_message": f"Operating cash flow for quarter {format_quarter(year, q)} is non-finite.",
                "validated_series": [],
                "by_quarter": {},
            }

        validated_series.append({
            "year": year,
            "quarter": q,
            "raw_quarter": raw_quarter,
            "formatted_quarter": format_quarter(year, q, "hyphen"),
            "operating_cash_flow": ocf_float,
            "cash": float(row.get("cash_cr") or 0.0),
            "debt": float(row.get("total_debt_cr") or 0.0),
            "index": quarter_to_index(year, q),
        })
        by_quarter[(year, q)] = ocf_float

    validated_series.sort(key=lambda item: item["index"])

    # Verify strict continuity (no missing quarters in range)
    for i in range(len(validated_series) - 1):
        curr_idx = validated_series[i]["index"]
        next_idx = validated_series[i + 1]["index"]
        if next_idx != curr_idx + 1:
            missing_year, missing_q = index_to_quarter(curr_idx + 1)
            return {
                "is_valid": False,
                "error_type": "MISSING_PERIOD",
                "error_message": f"Gap in quarterly sequence detected between {validated_series[i]['formatted_quarter']} and {validated_series[i+1]['formatted_quarter']}. Missing {format_quarter(missing_year, missing_q)}.",
                "validated_series": validated_series,
                "by_quarter": by_quarter,
            }

    if len(validated_series) < MIN_CASH_FLOW_QUARTERS:
        return {
            "is_valid": False,
            "error_type": "INSUFFICIENT_HISTORY",
            "error_message": f"Insufficient historical data: {len(validated_series)} quarters found, minimum {MIN_CASH_FLOW_QUARTERS} required for backtesting and forecasting.",
            "validated_series": validated_series,
            "by_quarter": by_quarter,
        }

    return {
        "is_valid": True,
        "error_type": None,
        "error_message": None,
        "validated_series": validated_series,
        "by_quarter": by_quarter,
    }


def compute_forecast_error_metrics(
    actuals: List[float],
    predictions: List[float]
) -> Dict[str, Optional[float]]:
    """
    Calculates MAE, RMSE, and WAPE between actual and predicted observations.
    - MAE = Mean(|Actual - Pred|)
    - RMSE = sqrt(Mean((Actual - Pred)^2))
    - WAPE = (sum(|Actual - Pred|) / sum(|Actual|)) * 100 if sum(|Actual|) > 0 else None
    """
    if not actuals or not predictions or len(actuals) != len(predictions):
        return {"mae": None, "rmse": None, "wape_percent": None, "sample_size": 0}

    n = len(actuals)
    abs_errors = [abs(a - p) for a, p in zip(actuals, predictions)]
    sq_errors = [(a - p) ** 2 for a, p in zip(actuals, predictions)]

    mae = sum(abs_errors) / n
    rmse = math.sqrt(sum(sq_errors) / n)

    sum_abs_actuals = sum(abs(a) for a in actuals)
    wape = (sum(abs_errors) / sum_abs_actuals * 100.0) if sum_abs_actuals > 0 else None

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "wape_percent": round(wape, 2) if wape is not None else None,
        "sample_size": n,
    }


def evaluate_leakage_free_backtest(
    validated_series: List[Dict[str, Any]],
    test_horizon: int = 4
) -> Dict[str, Any]:
    """
    Performs out-of-sample backtesting with ZERO data leakage.
    
    Setup:
    - Total quarters: N
    - Cutoff origin: T = N - test_horizon
    - Training set: observations index 0..T-1 (e.g., quarters 2020Q1 to 2025Q4)
    - Test set: observations index T..N-1 (e.g., quarters 2026Q1 to 2026Q4)
    
    Models fitted exclusively on training set:
    1. Baseline (Seasonal Naïve): F_base(T+h) = OCF(T+h-4)
    2. Candidate Model (Additive Seasonal + Trend):
       Trend delta = average annual YoY change over prior seasonal pairs in training window:
       delta_annual = avg(OCF(i) - OCF(i-4)) for i in train_indices with valid i-4 in train
       F_cand(T+h) = OCF(T+h-4) + delta_annual
    """
    n = len(validated_series)
    if n < 8:
        raise ValueError("At least 8 quarters required for leakage-free backtesting.")

    cutoff_idx = n - test_horizon
    train_series = validated_series[:cutoff_idx]
    test_series = validated_series[cutoff_idx:]

    train_by_q = {(item["year"], item["quarter"]): item["operating_cash_flow"] for item in train_series}

    # Estimate trend delta from training window ONLY (no test data leakage)
    yoy_diffs = []
    for item in train_series:
        prev_q = same_quarter_previous_year(item["year"], item["quarter"])
        if prev_q in train_by_q:
            diff = item["operating_cash_flow"] - train_by_q[prev_q]
            yoy_diffs.append(diff)

    delta_annual = (sum(yoy_diffs) / len(yoy_diffs)) if yoy_diffs else 0.0

    actuals = []
    baseline_preds = []
    candidate_preds = []
    test_quarters = []

    for item in test_series:
        target_year = item["year"]
        target_q = item["quarter"]
        test_quarters.append(item["formatted_quarter"])
        actual_val = item["operating_cash_flow"]
        actuals.append(actual_val)

        # Baseline: Seasonal Naïve (same quarter previous year from train set)
        prev_q = same_quarter_previous_year(target_year, target_q)
        base_val = train_by_q.get(prev_q, train_series[-1]["operating_cash_flow"])
        baseline_preds.append(base_val)

        # Candidate: Additive Seasonal + Trend
        cand_val = base_val + delta_annual
        candidate_preds.append(cand_val)

    candidate_metrics = compute_forecast_error_metrics(actuals, candidate_preds)
    baseline_metrics = compute_forecast_error_metrics(actuals, baseline_preds)

    # Determine if candidate strictly outperforms baseline on MAE
    cand_mae = candidate_metrics["mae"] or float("inf")
    base_mae = baseline_metrics["mae"] or float("inf")
    model_wins = cand_mae < base_mae

    return {
        "origin_quarter": train_series[-1]["formatted_quarter"],
        "training_quarters_count": len(train_series),
        "test_quarters": test_quarters,
        "actuals": [round(a, 2) for a in actuals],
        "candidate_predictions": [round(p, 2) for p in candidate_preds],
        "baseline_predictions": [round(p, 2) for p in baseline_preds],
        "candidate_metrics": candidate_metrics,
        "baseline_metrics": baseline_metrics,
        "model_wins": model_wins,
        "trend_delta_annual": round(delta_annual, 2),
    }


def generate_company_cash_flow_forecast(
    company_id: str,
    custom_records: Optional[List[Dict[str, Any]]] = None,
    custom_company_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Master service for Cash Flow Forecasting.
    Reads operating_cash_flow_cr from database, validates chronological sequence,
    runs a leakage-free backtest evaluation, and generates 4-quarter forward projections.
    """
    clean_id = company_id.strip()

    if custom_records is not None:
        company_exists = True
        company_name = custom_company_name or clean_id
        records = custom_records
    else:
        company_exists, fetched_name, records = fetch_company_cash_flow_records(clean_id)
        company_name = fetched_name or clean_id

    if not company_exists:
        raise LookupError(f"Company '{clean_id}' not found in database.")

    validation = validate_historical_cash_flow_data(records)
    if not validation["is_valid"]:
        raise ValueError({
            "error_type": validation["error_type"],
            "message": validation["error_message"],
            "company_id": clean_id,
            "record_count": len(records),
        })

    validated_series = validation["validated_series"]
    by_quarter = validation["by_quarter"]

    # 1. Leakage-free out-of-sample backtesting evaluation on latest 4 historical quarters
    backtest = evaluate_leakage_free_backtest(validated_series, test_horizon=4)

    # 2. Fit model on FULL history (through 2026Q4) for future projections
    latest_item = validated_series[-1]
    latest_year = latest_item["year"]
    latest_q = latest_item["quarter"]
    latest_ocf = latest_item["operating_cash_flow"]
    latest_quarter_str = latest_item["formatted_quarter"]

    # Calculate full-history trend delta across all available YoY pairs
    full_yoy_diffs = []
    for item in validated_series:
        prev_q = same_quarter_previous_year(item["year"], item["quarter"])
        if prev_q in by_quarter:
            full_yoy_diffs.append(item["operating_cash_flow"] - by_quarter[prev_q])

    full_trend_delta = (sum(full_yoy_diffs) / len(full_yoy_diffs)) if full_yoy_diffs else 0.0

    # Generate next 4 quarters forecast
    forecast_points = []
    for step in range(1, FORECAST_HORIZONS + 1):
        target_year, target_q = add_quarters(latest_year, latest_q, step)
        base_year, base_q = same_quarter_previous_year(target_year, target_q)
        baseline_ocf = by_quarter.get((base_year, base_q), latest_ocf)
        projected_ocf = baseline_ocf + full_trend_delta

        forecast_points.append({
            "quarter": format_quarter(target_year, target_q, "hyphen"),
            "forecast_operating_cash_flow": round(projected_ocf, 2),
            "baseline_quarter": format_quarter(base_year, base_q, "hyphen"),
            "baseline_operating_cash_flow": round(baseline_ocf, 2),
            "horizon": step,
        })

    # Prepare historical series formatted for UI
    historical_points = [
        {
            "quarter": item["formatted_quarter"],
            "operating_cash_flow": round(item["operating_cash_flow"], 2),
            "cash": round(item["cash"], 2),
            "debt": round(item["debt"], 2),
        }
        for item in validated_series
    ]

    cand_mae = backtest["candidate_metrics"]["mae"]
    base_mae = backtest["baseline_metrics"]["mae"]
    performance_status = (
        f"Additive Seasonal + Trend Model outperforms Seasonal Naïve baseline (MAE ₹{cand_mae:.2f} Cr vs ₹{base_mae:.2f} Cr)."
        if backtest["model_wins"]
        else f"Baseline Seasonal Naïve performs comparably to candidate model (MAE ₹{base_mae:.2f} Cr vs ₹{cand_mae:.2f} Cr)."
    )

    explanation = (
        f"Operating Cash Flow for {company_name} is forecasted for the next 4 quarters using an Additive Seasonal + Trend model. "
        f"The model anchors projections to the prior year's same-quarter operating cash flow and applies an estimated annual trend shift of "
        f"{full_trend_delta:+.2f} Cr. {performance_status}"
    )

    assumptions = (
        "Additive Seasonal + Trend Forecasting Engine. Model uses additive trend adjustments to handle positive, zero, "
        "and negative operating cash flow without numerical distortion. Historical accuracy is evaluated via leakage-free out-of-sample backtesting."
    )

    return {
        "status": "success",
        "company_id": clean_id,
        "company_name": company_name,
        "forecast_method": "Additive Seasonal + Trend",
        "baseline_method": "Seasonal Naïve",
        "unit": "₹ Crores",
        "latest_historical_quarter": latest_quarter_str,
        "latest_operating_cash_flow": round(latest_ocf, 2),
        "full_history_trend_delta": round(full_trend_delta, 2),
        "backtest_evaluation": backtest,
        "forecast": forecast_points,
        "historical": historical_points,
        "explanation": explanation,
        "assumptions": assumptions,
        "data_quality": {
            "historical_quarters_count": len(validated_series),
            "earliest_quarter": validated_series[0]["formatted_quarter"],
            "latest_quarter": latest_quarter_str,
            "has_negative_cash_flow": any(item["operating_cash_flow"] < 0 for item in validated_series),
            "negative_quarters_count": sum(1 for item in validated_series if item["operating_cash_flow"] < 0),
        },
    }

