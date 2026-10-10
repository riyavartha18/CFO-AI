# ============================================================
# SMART CFO
# DYNAMIC COMPANY ANALYSIS ENGINE
# SUPABASE → FEATURE ENGINEERING → ML + RULE ENGINE
# ============================================================


# ============================================================
# 1. IMPORTS
# ============================================================

import os
import sys
from pathlib import Path
import pandas as pd
import numpy as np
import psycopg2
import joblib

from dotenv import load_dotenv

# Ensure backend directory is in sys.path for rules import
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from rules.cfo_rules import forward_chaining, backward_chaining, get_risk_details_and_recommendations
except ImportError:
    from backend.rules.cfo_rules import forward_chaining, backward_chaining, get_risk_details_and_recommendations


# ============================================================
# 2. LOAD ENVIRONMENT VARIABLES
# ============================================================

env_path = BACKEND_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

print("HOST:", os.getenv("DB_HOST"))
print("PORT:", os.getenv("DB_PORT"))
print("DATABASE:", os.getenv("DB_NAME"))
print("USER:", os.getenv("DB_USER"))
print("PASSWORD FOUND:", bool(os.getenv("DB_PASSWORD")))


# ============================================================
# 3. ML FEATURE COLUMNS
# ============================================================

feature_columns = [

    "profit_margin",
    "roa",
    "roe",
    "current_ratio",
    "quick_ratio",
    "debt_to_equity",
    "debt_to_assets",
    "interest_coverage",
    "cash_to_debt",
    "operating_cash_flow_ratio",
    "asset_turnover",
    "inventory_turnover",
    "revenue_growth",
    "profit_growth",
    "cash_flow_growth"
]


# ============================================================
# 4. ANALYZE ANY COMPANY
# ============================================================

def analyze_company(company_id):

    print("\n" + "=" * 70)
    print("        SMART CFO - COMPANY ANALYSIS")
    print("=" * 70)

    print(f"\nAnalyzing Company ID: {company_id}")


    # ========================================================
    # 4.1 CONNECT TO SUPABASE
    # ========================================================

    conn = psycopg2.connect(

        host=os.getenv("DB_HOST"),

        database=os.getenv("DB_NAME"),

        user=os.getenv("DB_USER"),

        password=os.getenv("DB_PASSWORD"),

        port=os.getenv("DB_PORT")
    )

    print("\n✅ Supabase connected!")


    # ========================================================
    # 4.2 FETCH COMPANY DATA
    # ========================================================

    query = """
    SELECT *
    FROM financial_records
    WHERE company_id = %s
    ORDER BY quarter;
    """

    df = pd.read_sql(

        query,

        conn,

        params=(company_id,)
    )

    conn.close()


    print(
        f"Number of records found: {len(df)}"
    )


    # ========================================================
    # 4.3 CHECK IF COMPANY EXISTS
    # ========================================================

    if len(df) == 0:

        print(
            f"\n❌ No financial records found for company: "
            f"{company_id}"
        )

        return None


    print(
        f"✅ Financial data found for {company_id}"
    )


    # ========================================================
    # 5. RENAME DATABASE COLUMNS
    # ========================================================

    df = df.rename(columns={

        "revenue_cr": "revenue",

        "cogs_cr": "cogs",

        "operating_expenses_cr":
            "operating_expenses",

        "interest_expense_cr":
            "interest_expense",

        "depreciation_cr":
            "depreciation",

        "tax_cr":
            "tax_expense",

        "cash_cr":
            "cash",

        "accounts_receivable_cr":
            "accounts_receivable",

        "inventory_cr":
            "inventory",

        "fixed_assets_cr":
            "fixed_assets",

        "accounts_payable_cr":
            "accounts_payable",

        "short_term_debt_cr":
            "short_term_debt",

        "other_current_liabilities_cr":
            "other_current_liabilities",

        "long_term_debt_cr":
            "long_term_debt",

        "other_non_current_liabilities_cr":
            "other_non_current_liabilities",

        "operating_cash_flow_cr":
            "operating_cash_flow",

        "investing_cash_flow_cr":
            "investing_cash_flow",

        "financing_cash_flow_cr":
            "financing_cash_flow"
    })


    # ========================================================
    # 6. SORT DATA
    # ========================================================

    df = df.sort_values(

        ["company_id", "quarter"]

    ).reset_index(drop=True)


    # ========================================================
    # 7. DERIVED FINANCIAL VALUES
    # ========================================================

    # --------------------------------------------------------
    # EBITDA
    # --------------------------------------------------------

    df["ebitda"] = (

        df["revenue"]

        - df["cogs"]

        - df["operating_expenses"]
    )


    # --------------------------------------------------------
    # EBIT
    # --------------------------------------------------------

    df["ebit"] = (

        df["ebitda"]

        - df["depreciation"]
    )


    # --------------------------------------------------------
    # NET PROFIT
    # --------------------------------------------------------

    df["net_profit"] = (

        df["ebit"]

        - df["interest_expense"]

        - df["tax_expense"]
    )


    # --------------------------------------------------------
    # CURRENT ASSETS
    # --------------------------------------------------------

    df["current_assets"] = (

        df["cash"]

        + df["accounts_receivable"]

        + df["inventory"]
    )


    # --------------------------------------------------------
    # CURRENT LIABILITIES
    # --------------------------------------------------------

    df["current_liabilities"] = (

        df["accounts_payable"]

        + df["short_term_debt"]

        + df["other_current_liabilities"]
    )


    # --------------------------------------------------------
    # TOTAL DEBT
    # --------------------------------------------------------

    df["total_debt"] = (

        df["short_term_debt"]

        + df["long_term_debt"]
    )


    # --------------------------------------------------------
    # TOTAL LIABILITIES
    # --------------------------------------------------------

    df["total_liabilities"] = (

        df["current_liabilities"]

        + df["long_term_debt"]

        + df["other_non_current_liabilities"]
    )


    # --------------------------------------------------------
    # TOTAL ASSETS
    # --------------------------------------------------------

    df["total_assets"] = (

        df["current_assets"]

        + df["fixed_assets"]
    )


    # --------------------------------------------------------
    # EQUITY
    # --------------------------------------------------------

    df["equity"] = (

        df["total_assets"]

        - df["total_liabilities"]
    )


    print(
        "\n✅ Derived financial values calculated!"
    )


    # ========================================================
    # 8. FEATURE ENGINEERING
    # ========================================================

    # --------------------------------------------------------
    # 1. Profit Margin
    # --------------------------------------------------------

    # --------------------------------------------------------
    # 1. Profit Margin (%)
    # --------------------------------------------------------
    df["profit_margin"] = np.where(
        df["revenue"] != 0,
        (df["net_profit"] / df["revenue"]) * 100.0,
        0.0
    )

    # --------------------------------------------------------
    # 2. ROA (%)
    # --------------------------------------------------------
    df["roa"] = np.where(
        df["total_assets"] != 0,
        (df["net_profit"] / df["total_assets"]) * 100.0,
        0.0
    )

    # --------------------------------------------------------
    # 3. ROE (%)
    # --------------------------------------------------------
    df["roe"] = np.where(
        df["equity"] > 0,
        (df["net_profit"] / df["equity"]) * 100.0,
        np.where(df["net_profit"] < 0, -100.0, 0.0)
    )

    # --------------------------------------------------------
    # 4. Current Ratio
    # --------------------------------------------------------
    df["current_ratio"] = np.where(
        df["current_liabilities"] > 0,
        df["current_assets"] / df["current_liabilities"],
        np.where(df["current_assets"] > 0, 10.0, 1.0)
    )

    # --------------------------------------------------------
    # 5. Quick Ratio
    # --------------------------------------------------------
    df["quick_ratio"] = np.where(
        df["current_liabilities"] > 0,
        (df["cash"] + df["accounts_receivable"]) / df["current_liabilities"],
        np.where((df["cash"] + df["accounts_receivable"]) > 0, 10.0, 1.0)
    )

    # --------------------------------------------------------
    # 6. Debt to Equity
    # --------------------------------------------------------
    df["debt_to_equity"] = np.where(
        df["equity"] > 0,
        df["total_debt"] / df["equity"],
        np.where(df["total_debt"] > 0, 10.0, 0.0)
    )

    # --------------------------------------------------------
    # 7. Debt to Assets (%)
    # --------------------------------------------------------
    df["debt_to_assets"] = np.where(
        df["total_assets"] > 0,
        (df["total_debt"] / df["total_assets"]) * 100.0,
        0.0
    )

    # --------------------------------------------------------
    # 8. Interest Coverage
    # --------------------------------------------------------
    df["interest_coverage"] = np.where(
        df["interest_expense"] > 0,
        df["ebit"] / df["interest_expense"],
        np.where(df["ebit"] >= 0, 100.0, 0.0)
    )

    # --------------------------------------------------------
    # 9. Cash to Debt
    # --------------------------------------------------------
    df["cash_to_debt"] = np.where(
        df["total_debt"] > 0,
        df["cash"] / df["total_debt"],
        np.where(df["cash"] > 0, 10.0, 0.0)
    )

    # --------------------------------------------------------
    # 10. Operating Cash Flow Ratio
    # --------------------------------------------------------
    df["operating_cash_flow_ratio"] = np.where(
        df["current_liabilities"] > 0,
        df["operating_cash_flow"] / df["current_liabilities"],
        np.where(df["operating_cash_flow"] > 0, 10.0, 0.0)
    )

    # --------------------------------------------------------
    # 11. Asset Turnover
    # --------------------------------------------------------
    df["asset_turnover"] = np.where(
        df["total_assets"] > 0,
        df["revenue"] / df["total_assets"],
        0.0
    )

    # --------------------------------------------------------
    # 12. Inventory Turnover
    # --------------------------------------------------------
    df["inventory_turnover"] = np.where(
        df["inventory"] > 0,
        df["cogs"] / df["inventory"],
        0.0
    )

    # --------------------------------------------------------
    # 13. Revenue Growth (QoQ %)
    # --------------------------------------------------------
    rev = df["revenue"]
    prev_rev = rev.shift(1)
    df["revenue_growth"] = np.where(
        (prev_rev.notna()) & (prev_rev > 0),
        ((rev - prev_rev) / prev_rev) * 100.0,
        0.0
    )

    # --------------------------------------------------------
    # 14. Profit Growth (QoQ %)
    # --------------------------------------------------------
    pat = df["net_profit"]
    prev_pat = pat.shift(1)
    df["profit_growth"] = np.where(
        (prev_pat.notna()) & (prev_pat != 0),
        ((pat - prev_pat) / np.abs(prev_pat)) * 100.0,
        0.0
    )

    # --------------------------------------------------------
    # 15. Cash Flow Growth (QoQ %)
    # --------------------------------------------------------
    ocf = df["operating_cash_flow"]
    prev_ocf = ocf.shift(1)
    df["cash_flow_growth"] = np.where(
        (prev_ocf.notna()) & (prev_ocf != 0),
        ((ocf - prev_ocf) / np.abs(prev_ocf)) * 100.0,
        0.0
    )

    # ========================================================
    # 9. SANITIZE INFINITY AND MISSING VALUES
    # ========================================================
    df[feature_columns] = df[feature_columns].fillna(0.0).replace([np.inf, -np.inf], 0.0)


    # ========================================================
    # 10. CHECK MISSING VALUES
    # ========================================================

    missing_values = (

        df[feature_columns]

        .isna()

        .sum()

        .sum()
    )


    if missing_values > 0:

        print(
            "\n❌ Missing values found in ML features."
        )

        print(
            df[feature_columns]
            .isna()
            .sum()
        )

        return None


    print(
        "\n✅ No missing values in ML features!"
    )


    # ========================================================
    # 11. LOAD TRAINED ML MODEL
    # ========================================================

    model_path = PROJECT_ROOT / "ml" / "models" / "cfo_risk_model.pkl"
    features_path = PROJECT_ROOT / "ml" / "models" / "cfo_feature_columns.pkl"

    if not model_path.exists():
        model_path = Path("ml/models/cfo_risk_model.pkl")
        features_path = Path("ml/models/cfo_feature_columns.pkl")

    model = joblib.load(
        model_path
    )


    trained_features = joblib.load(
        features_path
    )


    print(
        "\n✅ Trained ML model loaded!"
    )


    # ========================================================
    # 12. VERIFY FEATURE ORDER
    # ========================================================

    if feature_columns != trained_features:

        raise ValueError(

            "❌ Feature order/name mismatch "
            "between training and prediction!"
        )


    print(
        "✅ Feature order matches training!"
    )


    # ========================================================
    # 13. PREPARE MODEL INPUT
    # ========================================================

    X = df[trained_features]


    print(
        "\nModel Input Shape:",
        X.shape
    )


    # ========================================================
    # 14. ML RISK PREDICTION
    # ========================================================

    predictions = model.predict(X)


    df["predicted_risk"] = predictions


    # ========================================================
    # 15. RISK PROBABILITIES
    # ========================================================

    classes = []

    if hasattr(model, "predict_proba"):

        probabilities = model.predict_proba(X)

        classes = model.classes_


        for i, class_name in enumerate(classes):

            column_name = (

                f"{class_name.lower().replace(' ', '_')}"
                "_probability"
            )

            df[column_name] = (

                probabilities[:, i]
            )


    # ========================================================
    # 16. FORWARD CHAINING
    # ========================================================

    rule_results = []


    for _, row in df.iterrows():

        financial_data = row.to_dict()


        detected_risks = (

            forward_chaining(
                financial_data
            )
        )


        rule_results.append(
            detected_risks
        )


    df["rule_based_risks"] = (
        rule_results
    )


    # ========================================================
    # 17. DISPLAY QUARTER-WISE ANALYSIS
    # ========================================================

    print("\n" + "=" * 70)

    print(
        "        SMART CFO RULE ENGINE ANALYSIS"
    )

    print("=" * 70)


    for _, row in df.iterrows():

        print("\n" + "-" * 70)


        print(
            f"Quarter: {row['quarter']}"
        )


        print(
            f"ML Risk: {row['predicted_risk']}"
        )


        risks = row[
            "rule_based_risks"
        ]


        # ----------------------------------------------------
        # FORWARD CHAINING
        # ----------------------------------------------------

        if risks:

            print(
                "\nFORWARD CHAINING:"
            )


            print(
                "Detected Risks:"
            )


            for risk in risks:

                print(
                    "⚠️",
                    risk["conclusion"]
                )


            # ------------------------------------------------
            # BACKWARD CHAINING
            # ------------------------------------------------

            print(
                "\nBACKWARD CHAINING:"
            )


            print(
                "Why were these risks detected?"
            )


            for risk in risks:

                target = (
                    risk["conclusion"]
                )


                explanation = (

                    backward_chaining(

                        row.to_dict(),

                        target
                    )
                )


                if explanation:

                    for reason in explanation:

                        print(
                            "→",
                            reason
                        )

                else:

                    print(
                        "→ No explanation found for",
                        target
                    )


        else:

            print(
                "\nFORWARD CHAINING:"
            )


            print(
                "✅ No rule-based risks detected"
            )


            print(
                "\nBACKWARD CHAINING:"
            )


            print(
                "✅ No risk requires explanation"
            )


    # ========================================================
    # 18. LATEST QUARTER
    # ========================================================

    latest = df.iloc[-1]


    print("\n" + "=" * 70)

    print(
        "        LATEST FINANCIAL RISK"
    )

    print("=" * 70)


    print(
        "Company ID:",
        company_id
    )


    print(
        "Quarter:",
        latest["quarter"]
    )


    print(
        "Predicted Risk:",
        latest["predicted_risk"]
    )


    # ========================================================
    # 19. LATEST QUARTER RULE ANALYSIS
    # ========================================================

    latest_risks = (

        latest[
            "rule_based_risks"
        ]
    )


    print("\n" + "=" * 70)

    print(
        "        LATEST QUARTER EXPLANATION"
    )

    print("=" * 70)


    if latest_risks:

        print(
            "\nDetected Risks:"
        )


        for risk in latest_risks:

            print(
                "⚠️",
                risk["conclusion"]
            )


        print(
            "\nWhy?"
        )


        for risk in latest_risks:

            target = (
                risk["conclusion"]
            )


            explanation = (

                backward_chaining(

                    latest.to_dict(),

                    target
                )
            )


            if explanation:

                for reason in explanation:

                    print(
                        "→",
                        reason
                    )

    else:

        print(
            "✅ No rule-based risks detected."
        )


    # ========================================================
    # 20. LATEST RISK PROBABILITIES
    # ========================================================

    risk_probabilities = {}


    if hasattr(model, "predict_proba"):

        print(
            "\nRisk Probabilities:"
        )


        for class_name in classes:

            column_name = (

                f"{class_name.lower().replace(' ', '_')}"
                "_probability"
            )


            probability = (

                latest[column_name]
                * 100
            )


            risk_probabilities[
                class_name
            ] = float(
                probability
            )


            print(
                f"{class_name}: "
                f"{probability:.2f}%"
            )


    # ========================================================
    # 21. PREPARE STRUCTURED RESULT
    #     THIS WILL BE USED BY DJANGO LATER
    # ========================================================

    latest_rule_risks = []


    for risk in latest_risks:

        target = (
            risk["conclusion"]
        )


        explanation = (

            backward_chaining(

                latest.to_dict(),

                target
            )
        )


        details = get_risk_details_and_recommendations(latest.to_dict(), target)

        risk_entry = {
            "risk": target,
            "rule": risk["rule"],
            "explanation": explanation,
            "slug": details["slug"],
            "severity": details["severity"],
            "category": details["category"],
            "metric_name": details["metric_name"],
            "actual_value": details["actual_value"],
            "threshold_display": details["threshold_display"],
            "potential_impact": details["potential_impact"],
            "recommendations": details["recommendations"],
            "action_plan": details["action_plan"],
            "monitoring_metrics": details["monitoring_metrics"]
        }

        latest_rule_risks.append(risk_entry)


    def _safe_float(val, default=0.0):
        if val is None or pd.isna(val) or np.isnan(val) or np.isinf(val):
            return default
        return round(float(val), 2)

    # Multi-quarter historical trends calculated from database records
    quarterly_trends = []
    for _, row in df.iterrows():
        quarterly_trends.append({
            "quarter": str(row["quarter"]),
            "revenue": _safe_float(row["revenue"]),
            "net_profit": _safe_float(row["net_profit"]),
            "cash": _safe_float(row["cash"]),
            "total_debt": _safe_float(row["total_debt"]),
            "operating_cash_flow": _safe_float(row["operating_cash_flow"]),
            "predicted_risk": str(row.get("predicted_risk", "Low Risk")),
        })

    # 15 engineered financial ratios for latest quarter (Reporting API)
    financial_ratios = {}
    is_first_quarter = len(df) <= 1 or latest["quarter"] == df.iloc[0]["quarter"]
    is_negative_equity = latest.get("equity", 1.0) <= 0 and latest.get("total_debt", 0) > 0

    for feature in trained_features:
        val = latest[feature]
        if feature == "debt_to_equity" and is_negative_equity:
            financial_ratios[feature] = None  # Explicit N/A for reporting negative equity
        elif feature in ["revenue_growth", "profit_growth", "cash_flow_growth"] and is_first_quarter:
            financial_ratios[feature] = None  # Explicit N/A for first quarter growth
        else:
            financial_ratios[feature] = _safe_float(val)

    result = {

        "company_id": company_id,

        "latest_quarter":
            str(latest["quarter"]),

        "predicted_risk":
            str(latest["predicted_risk"]),

        "risk_probabilities":
            risk_probabilities,

        "rule_based_risks":
            latest_rule_risks,

        "financial_metrics": {
            "revenue": _safe_float(latest["revenue"]),
            "cogs": _safe_float(latest["cogs"]),
            "operating_expenses": _safe_float(latest["operating_expenses"]),
            "ebitda": _safe_float(latest["ebitda"]),
            "ebit": _safe_float(latest["ebit"]),
            "interest_expense": _safe_float(latest["interest_expense"]),
            "tax_expense": _safe_float(latest["tax_expense"]),
            "net_profit": _safe_float(latest["net_profit"]),
            "cash": _safe_float(latest["cash"]),
            "accounts_receivable": _safe_float(latest["accounts_receivable"]),
            "inventory": _safe_float(latest["inventory"]),
            "fixed_assets": _safe_float(latest["fixed_assets"]),
            "current_assets": _safe_float(latest["current_assets"]),
            "total_assets": _safe_float(latest["total_assets"]),
            "accounts_payable": _safe_float(latest["accounts_payable"]),
            "short_term_debt": _safe_float(latest["short_term_debt"]),
            "long_term_debt": _safe_float(latest["long_term_debt"]),
            "current_liabilities": _safe_float(latest["current_liabilities"]),
            "total_debt": _safe_float(latest["total_debt"]),
            "total_liabilities": _safe_float(latest["total_liabilities"]),
            "equity": _safe_float(latest["equity"]),
            "operating_cash_flow": _safe_float(latest["operating_cash_flow"]),
            "investing_cash_flow": _safe_float(latest["investing_cash_flow"]),
            "financing_cash_flow": _safe_float(latest["financing_cash_flow"]),
        },

        "financial_ratios": financial_ratios,

        "quarterly_trends": quarterly_trends,

    }


    # ========================================================
    # 22. FINAL STATUS
    # ========================================================

    print("\n" + "=" * 70)

    print(
        "✅ SMART CFO ANALYSIS COMPLETED!"
    )

    print("=" * 70)


    return result


# ============================================================
# 23. RUN FROM TERMINAL
# ============================================================

if __name__ == "__main__":

    print("\n" + "=" * 70)

    print(
        "          SMART CFO - DYNAMIC ANALYSIS"
    )

    print("=" * 70)


    company_id = input(
        "\nEnter Company ID: "
    ).strip()


    if not company_id:

        print(
            "\n❌ Company ID cannot be empty."
        )

    else:

        result = analyze_company(
            company_id
        )


        if result:

            print("\n")
            print("=" * 70)

            print(
                "FINAL RESULT"
            )

            print("=" * 70)


            print(
                "\nCompany ID:",
                result["company_id"]
            )


            print(
                "Latest Quarter:",
                result["latest_quarter"]
            )


            print(
                "Predicted Risk:",
                result["predicted_risk"]
            )


            print(
                "\nRisk Probabilities:"
            )


            for risk, probability in result[
                "risk_probabilities"
            ].items():

                print(
                    f"  {risk}: "
                    f"{probability:.2f}%"
                )


            print(
                "\nRule-Based Analysis:"
            )


            if result[
                "rule_based_risks"
            ]:

                for item in result[
                    "rule_based_risks"
                ]:

                    print(
                        f"\n⚠️ {item['risk']}"
                    )


                    print(
                        f"   Rule: {item['rule']}"
                    )


                    for explanation in item[
                        "explanation"
                    ]:

                        print(
                            f"   Why: {explanation}"
                        )

            else:

                print(
                    "  ✅ No rule-based risks detected."
                )