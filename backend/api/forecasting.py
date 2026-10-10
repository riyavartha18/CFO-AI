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
