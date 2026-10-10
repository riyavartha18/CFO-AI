import os
import psycopg2
import pandas as pd
import numpy as np
from datetime import datetime

from .feature_engineering import FEATURE_METADATA, prepare_features
from .isolation_forest import fit_predict_isolation_forest
from .scoring import compute_historical_deviations
from .explanations import generate_multivariate_summary, generate_parameter_explanation

# In-memory store for scan timestamps and review states
_scan_metadata = {}
_reviewed_records = set()


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT")
    )


def fetch_company_data(company_id: str):
    """
    Fetch financial records and company metadata directly from Supabase Postgres DB.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT company_id, company_name, industry, company_size FROM companies WHERE company_id = %s;",
            (company_id,)
        )
        comp_row = cur.fetchone()
        cur.close()

        if comp_row:
            company_info = {
                "company_id": comp_row[0],
                "company_name": comp_row[1],
                "industry": comp_row[2],
                "company_size": comp_row[3]
            }
        else:
            company_info = {
                "company_id": company_id,
                "company_name": f"Company {company_id}",
                "industry": "General Industry",
                "company_size": "Medium"
            }

        query = """
            SELECT 
                id, company_id, quarter,
                revenue_cr, cogs_cr, operating_expenses_cr, interest_expense_cr,
                depreciation_cr, tax_cr, cash_cr, accounts_receivable_cr,
                inventory_cr, fixed_assets_cr, accounts_payable_cr,
                short_term_debt_cr, other_current_liabilities_cr,
                long_term_debt_cr, other_non_current_liabilities_cr,
                operating_cash_flow_cr, investing_cash_flow_cr, financing_cash_flow_cr
            FROM financial_records
            WHERE company_id = %s
            ORDER BY quarter ASC;
        """
        df = pd.read_sql(query, conn, params=(company_id,))
        conn.close()

        return company_info, df
    except Exception as e:
        conn.close()
        raise e


def analyze_anomalies_for_company(company_id: str, re_scan: bool = False):
    """
    High-level orchestrator service for Isolation Forest Anomaly Detection.
    Calculates multivariate anomaly flags, parameter-specific unusual trends,
    and parameter-level summary statistics for pie/donut charts.
    """
    company_info, df = fetch_company_data(company_id)

    if df.empty:
        return {
            "company_info": company_info,
            "summary": {
                "total_records": 0,
                "flagged_anomalies": 0,
                "normal_records": 0,
                "anomaly_percentage": 0.0,
                "last_scan_time": _scan_metadata.get(company_id, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            },
            "parameter_summary": {
                "total_evaluated_parameters": 0,
                "normal_count": 0,
                "normal_percentage": 0.0,
                "unusual_count": 0,
                "unusual_percentage": 0.0
            },
            "metrics_summary": {
                "total_metrics": 0,
                "normal_metrics_count": 0,
                "normal_metrics_percentage": 0.0,
                "unusual_metrics_count": 0,
                "unusual_metrics_percentage": 0.0,
                "review_metrics_count": 0,
                "review_metrics_percentage": 0.0,
                "metric_classifications": {}
            },
            "records": [],
            "charts_data": {},
            "insufficient_data": True,
            "message": f"No financial records available for company {company_id}."
        }

    df = prepare_features(df)

    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    _scan_metadata[company_id] = now_iso

    feature_cols = list(FEATURE_METADATA.keys())
    valid_feature_cols = [col for col in feature_cols if col in df.columns]

    # Model training and prediction
    X = df[valid_feature_cols].copy()
    is_anomaly_array, raw_scores = fit_predict_isolation_forest(X, contamination=0.10)

    df["is_anomaly"] = is_anomaly_array
    df["decision_score"] = raw_scores

    # Parameter-level Scoring & Deviations
    all_deviations = compute_historical_deviations(df, valid_feature_cols)

    records_list = []
    total_evaluated_parameters = 0
    unusual_parameters_count = 0

    for idx, row in df.iterrows():
        record_id = int(row["id"])
        quarter = str(row["quarter"])
        is_anom = bool(row["is_anomaly"])
        dec_score = float(row["decision_score"])
        row_devs = all_deviations[idx]

        # Count parameter-level evaluations
        total_evaluated_parameters += len(row_devs)
        unusual_in_row = [d for d in row_devs if d["is_unusual"]]
        unusual_parameters_count += len(unusual_in_row)

        top_contributors = row_devs[:4]

        explanation_text = generate_multivariate_summary(
            quarter=quarter,
            is_anom=is_anom,
            decision_score=dec_score,
            unusual_params=unusual_in_row
        )

        records_list.append({
            "record_id": record_id,
            "company_id": company_id,
            "quarter": quarter,
            "is_anomaly": is_anom,
            "anomaly_status": "ANOMALY PRESENT" if is_anom else "No Anomaly Detected",
            "decision_score": round(dec_score, 4),
            "is_reviewed": record_id in _reviewed_records,
            "explanation": explanation_text,
            "top_contributors": top_contributors,
            "unusual_parameters": unusual_in_row,
            "metrics": {col: round(float(row[col]), 2) for col in valid_feature_cols},
            "all_deviations": row_devs
        })

    # Summary Statistics for Quarterly Records
    total_records = len(records_list)
    flagged_anomalies = sum(1 for r in records_list if r["is_anomaly"])
    normal_records = total_records - flagged_anomalies
    anomaly_percentage = round((flagged_anomalies / total_records) * 100.0, 1) if total_records > 0 else 0.0

    # Parameter-level Donut Summary Statistics
    normal_parameters_count = total_evaluated_parameters - unusual_parameters_count
    normal_param_pct = round((normal_parameters_count / total_evaluated_parameters) * 100.0, 1) if total_evaluated_parameters > 0 else 0.0
    unusual_param_pct = round((unusual_parameters_count / total_evaluated_parameters) * 100.0, 1) if total_evaluated_parameters > 0 else 0.0

    parameter_summary = {
        "total_evaluated_parameters": total_evaluated_parameters,
        "normal_count": normal_parameters_count,
        "normal_percentage": normal_param_pct,
        "unusual_count": unusual_parameters_count,
        "unusual_percentage": unusual_param_pct
    }

    # Distinct Metric-level Categorization & Summary Cards
    total_metrics = len(valid_feature_cols)
    normal_metrics_count = 0
    unusual_metrics_count = 0
    review_metrics_count = 0
    metric_classifications = {}

    for col in valid_feature_cols:
        valid_vals = df[col].dropna()
        if len(df) < 4 or len(valid_vals) < 4:
            classification = "review"
            review_metrics_count += 1
        else:
            has_unusual = any(
                any(d["feature_key"] == col and d["is_unusual"] for d in r["all_deviations"])
                for r in records_list
            )
            if has_unusual:
                classification = "unusual"
                unusual_metrics_count += 1
            else:
                classification = "normal"
                normal_metrics_count += 1

        metric_classifications[col] = classification

    normal_metrics_pct = round((normal_metrics_count / total_metrics) * 100.0, 1) if total_metrics > 0 else 0.0
    unusual_metrics_pct = round((unusual_metrics_count / total_metrics) * 100.0, 1) if total_metrics > 0 else 0.0
    review_metrics_pct = round((review_metrics_count / total_metrics) * 100.0, 1) if total_metrics > 0 else 0.0

    metrics_summary = {
        "total_metrics": total_metrics,
        "normal_metrics_count": normal_metrics_count,
        "normal_metrics_percentage": normal_metrics_pct,
        "unusual_metrics_count": unusual_metrics_count,
        "unusual_metrics_percentage": unusual_metrics_pct,
        "review_metrics_count": review_metrics_count,
        "review_metrics_percentage": review_metrics_pct,
        "metric_classifications": metric_classifications
    }

    # Build time-series chart dataset for overview dashboard
    charts_data = {}
    for col in valid_feature_cols:
        meta = FEATURE_METADATA[col]

        has_parameter_anomalies = metric_classifications.get(col) == "unusual"

        charts_data[col] = {
            "key": col,
            "title": meta["label"],
            "unit": meta["unit"],
            "category": meta["category"],
            "has_parameter_anomalies": has_parameter_anomalies,
            "metric_status": metric_classifications.get(col, "normal"),
            "series": [
                {
                    "quarter": r["quarter"],
                    "value": r["metrics"][col],
                    "is_anomaly": r["is_anomaly"],
                    "is_parameter_unusual": any(d["feature_key"] == col and d["is_unusual"] for d in r["all_deviations"]),
                    "record_id": r["record_id"],
                    "decision_score": r["decision_score"]
                }
                for r in records_list
            ]
        }

    return {
        "company_info": company_info,
        "summary": {
            "total_records": total_records,
            "flagged_anomalies": flagged_anomalies,
            "normal_records": normal_records,
            "anomaly_percentage": anomaly_percentage,
            "last_scan_time": _scan_metadata[company_id]
        },
        "parameter_summary": parameter_summary,
        "metrics_summary": metrics_summary,
        "records": records_list,
        "charts_data": charts_data,
        "insufficient_data": False
    }


def get_single_record_anomaly_details(record_id: int, feature_key: str = None):
    """
    Retrieve parameter-focused anomaly details for in-page popup modal consumption.
    Focuses specifically on the requested feature_key parameter.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT company_id, quarter FROM financial_records WHERE id = %s;", (record_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return None

    company_id, quarter = row[0], row[1]
    overview = analyze_anomalies_for_company(company_id)

    target_record = None
    for r in overview["records"]:
        if r["record_id"] == record_id:
            target_record = r
            break

    if not target_record:
        return None

    if not feature_key or feature_key not in overview["charts_data"]:
        if target_record["unusual_parameters"]:
            feature_key = target_record["unusual_parameters"][0]["feature_key"]
        elif target_record["top_contributors"]:
            feature_key = target_record["top_contributors"][0]["feature_key"]
        else:
            feature_key = "revenue"

    param_dev = next((d for d in target_record["all_deviations"] if d["feature_key"] == feature_key), None)

    if not param_dev:
        return None

    param_chart = overview["charts_data"][feature_key]

    return {
        "company_info": overview["company_info"],
        "quarter": quarter,
        "record_id": record_id,
        "is_quarter_anomaly": target_record["is_anomaly"],
        "decision_score": target_record["decision_score"],
        "is_reviewed": target_record["is_reviewed"],
        "parameter": param_dev,
        "historical_trend": param_chart,
        "summary": overview["summary"],
        "parameter_summary": overview["parameter_summary"]
    }


def toggle_record_review(record_id: int, reviewed: bool):
    """
    Toggle record review state.
    """
    if reviewed:
        _reviewed_records.add(record_id)
    else:
        _reviewed_records.discard(record_id)
    return True
