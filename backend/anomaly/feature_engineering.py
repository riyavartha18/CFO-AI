import pandas as pd
import numpy as np

FEATURE_METADATA = {
    "revenue": {"label": "Revenue", "unit": "₹ Cr", "category": "Revenue & Expenses"},
    "cogs": {"label": "Cost of Goods Sold", "unit": "₹ Cr", "category": "Revenue & Expenses"},
    "operating_expenses": {"label": "Operating Expenses", "unit": "₹ Cr", "category": "Revenue & Expenses"},
    "total_expenses": {"label": "Total Expenses", "unit": "₹ Cr", "category": "Revenue & Expenses"},
    "interest_expense": {"label": "Interest Expense", "unit": "₹ Cr", "category": "Revenue & Expenses"},
    "depreciation": {"label": "Depreciation", "unit": "₹ Cr", "category": "Revenue & Expenses"},
    "tax_expense": {"label": "Tax Expense", "unit": "₹ Cr", "category": "Revenue & Expenses"},
    "operating_profit": {"label": "Operating Profit", "unit": "₹ Cr", "category": "Profitability"},
    "operating_profit_margin": {"label": "Operating Profit Margin", "unit": "%", "category": "Profitability"},
    "revenue_growth": {"label": "Revenue Growth (QoQ)", "unit": "%", "category": "Profitability"},
    "expense_growth": {"label": "Expense Growth (QoQ)", "unit": "%", "category": "Profitability"},
    "cash": {"label": "Cash Balance", "unit": "₹ Cr", "category": "Cash Flow & Liquidity"},
    "operating_cash_flow": {"label": "Operating Cash Flow", "unit": "₹ Cr", "category": "Cash Flow & Liquidity"},
    "investing_cash_flow": {"label": "Investing Cash Flow", "unit": "₹ Cr", "category": "Cash Flow & Liquidity"},
    "financing_cash_flow": {"label": "Financing Cash Flow", "unit": "₹ Cr", "category": "Cash Flow & Liquidity"},
    "accounts_receivable": {"label": "Accounts Receivable", "unit": "₹ Cr", "category": "Cash Flow & Liquidity"},
    "inventory": {"label": "Inventory", "unit": "₹ Cr", "category": "Cash Flow & Liquidity"},
    "accounts_payable": {"label": "Accounts Payable", "unit": "₹ Cr", "category": "Cash Flow & Liquidity"},
    "short_term_debt": {"label": "Short-Term Debt", "unit": "₹ Cr", "category": "Debt & Assets"},
    "long_term_debt": {"label": "Long-Term Debt", "unit": "₹ Cr", "category": "Debt & Assets"},
    "total_debt": {"label": "Total Debt", "unit": "₹ Cr", "category": "Debt & Assets"},
    "fixed_assets": {"label": "Fixed Assets", "unit": "₹ Cr", "category": "Debt & Assets"},
    "other_current_liabilities": {"label": "Other Current Liabilities", "unit": "₹ Cr", "category": "Debt & Assets"},
    "other_non_current_liabilities": {"label": "Other Non-Current Liabilities", "unit": "₹ Cr", "category": "Debt & Assets"},
}


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Renames Supabase financial columns and calculates derived financial metrics.
    Prevents division by zero and handles missing values safely.
    """
    renames = {
        "revenue_cr": "revenue",
        "cogs_cr": "cogs",
        "operating_expenses_cr": "operating_expenses",
        "interest_expense_cr": "interest_expense",
        "depreciation_cr": "depreciation",
        "tax_cr": "tax_expense",
        "cash_cr": "cash",
        "accounts_receivable_cr": "accounts_receivable",
        "inventory_cr": "inventory",
        "fixed_assets_cr": "fixed_assets",
        "accounts_payable_cr": "accounts_payable",
        "short_term_debt_cr": "short_term_debt",
        "other_current_liabilities_cr": "other_current_liabilities",
        "long_term_debt_cr": "long_term_debt",
        "other_non_current_liabilities_cr": "other_non_current_liabilities",
        "operating_cash_flow_cr": "operating_cash_flow",
        "investing_cash_flow_cr": "investing_cash_flow",
        "financing_cash_flow_cr": "financing_cash_flow"
    }
    df = df.rename(columns=renames)

    # Convert numeric fields to float
    for col in renames.values():
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)

    # Calculate derived Profitability & Expense Metrics
    df["total_expenses"] = df["cogs"] + df["operating_expenses"]
    df["operating_profit"] = df["revenue"] - df["cogs"] - df["operating_expenses"] - df["depreciation"]
    df["operating_profit_margin"] = np.where(
        df["revenue"] != 0,
        (df["operating_profit"] / df["revenue"]) * 100.0,
        0.0
    )

    # Debt metrics
    df["total_debt"] = df["short_term_debt"] + df["long_term_debt"]

    # Growth Metrics (QoQ %)
    df["revenue_growth"] = (
        df["revenue"].pct_change().fillna(0.0) * 100.0
    )
    df["expense_growth"] = (
        df["total_expenses"].pct_change().fillna(0.0) * 100.0
    )

    return df
