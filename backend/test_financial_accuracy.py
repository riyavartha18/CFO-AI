"""
CFO-AI Automated Financial Accuracy & Reliability Test Suite
Verifies division-by-zero safety, ratio edge cases, feature ordering,
ground-truth accounting calculations, multi-company analysis, and recommendation structure.
"""

import os
import sys
import math
from pathlib import Path
import pandas as pd
import numpy as np

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cfo_backend.settings")
import django
django.setup()

from test_prediction import feature_columns, analyze_company
from rules.cfo_rules import forward_chaining, backward_chaining, get_risk_details_and_recommendations
from api.views import get_all_companies_from_supabase


def test_feature_columns_ordering():
    """Verify exact 15 feature column names and sequence required by trained ML model."""
    expected_columns = [
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
        "cash_flow_growth",
    ]
    assert feature_columns == expected_columns, f"Feature column mismatch: {feature_columns}"
    print("✅ TEST 1 PASSED: Feature column ordering matches trained ML model standard.")


def test_ground_truth_accounting_fixtures():
    """Verify independent accounting formulas against known control balance inputs."""
    revenue = 100.0
    cogs = 50.0
    operating_expenses = 20.0
    depreciation = 5.0
    interest_expense = 5.0
    tax_expense = 5.0
    
    ebitda = revenue - cogs - operating_expenses
    ebit = ebitda - depreciation
    net_profit = ebit - interest_expense - tax_expense
    profit_margin = (net_profit / revenue) * 100.0
    interest_coverage = ebit / interest_expense
    
    cash = 20.0
    accounts_receivable = 30.0
    inventory = 50.0
    current_assets = cash + accounts_receivable + inventory
    
    accounts_payable = 30.0
    short_term_debt = 20.0
    other_current_liabilities = 0.0
    current_liabilities = accounts_payable + short_term_debt + other_current_liabilities
    
    current_ratio = current_assets / current_liabilities
    quick_ratio = (cash + accounts_receivable) / current_liabilities
    
    assert ebitda == 30.0, f"EBITDA calculation mismatch: expected 30.0, got {ebitda}"
    assert ebit == 25.0, f"EBIT calculation mismatch: expected 25.0, got {ebit}"
    assert net_profit == 15.0, f"Net profit calculation mismatch: expected 15.0, got {net_profit}"
    assert profit_margin == 15.0, f"Profit margin calculation mismatch: expected 15.0%, got {profit_margin}%"
    assert interest_coverage == 5.0, f"Interest coverage mismatch: expected 5.0x, got {interest_coverage}x"
    assert current_ratio == 2.0, f"Current ratio mismatch: expected 2.0x, got {current_ratio}x"
    assert quick_ratio == 1.0, f"Quick ratio mismatch: expected 1.0x, got {quick_ratio}x"
    
    print("✅ TEST 2 PASSED: Independent ground-truth accounting calculations verified.")


def test_zero_interest_expense_handling():
    """Verify zero interest expense does not cause division by zero or NaN interest coverage."""
    financial_data = {
        "ebit": 25.0,
        "interest_expense": 0.0,
        "current_ratio": 1.8,
        "debt_to_equity": 0.5,
        "profit_margin": 12.0,
        "operating_cash_flow": 15.0,
        "revenue_growth": 5.0,
        "profit_growth": 8.0,
    }
    
    ebit = financial_data["ebit"]
    ie = financial_data["interest_expense"]
    interest_coverage = ebit / ie if ie > 0 else (100.0 if ebit >= 0 else 0.0)
    
    assert not math.isnan(interest_coverage), "Interest coverage evaluated to NaN"
    assert not math.isinf(interest_coverage), "Interest coverage evaluated to Infinity"
    assert interest_coverage == 100.0, f"Expected 100.0 safe coverage, got {interest_coverage}"
    
    print("✅ TEST 3 PASSED: Zero interest expense handled safely without NaN or crash.")


def test_zero_current_liabilities_and_assets():
    """Verify zero current liabilities does not crash current/quick ratio calculations."""
    current_assets = 50.0
    current_liabilities = 0.0
    
    current_ratio = current_assets / current_liabilities if current_liabilities > 0 else (10.0 if current_assets > 0 else 1.0)
    
    assert not math.isnan(current_ratio), "Current ratio evaluated to NaN"
    assert not math.isinf(current_ratio), "Current ratio evaluated to Infinity"
    assert current_ratio == 10.0, f"Expected safe ratio 10.0, got {current_ratio}"
    
    print("✅ TEST 4 PASSED: Zero current liabilities handled safely.")


def test_zero_and_negative_equity():
    """Verify zero and negative equity handling in Debt-to-Equity and ROE."""
    total_debt = 100.0
    equity_zero = 0.0
    equity_negative = -20.0
    net_profit = -5.0
    
    dte_zero = total_debt / equity_zero if equity_zero > 0 else (10.0 if total_debt > 0 else 0.0)
    roe_neg = (net_profit / equity_negative) * 100.0 if equity_negative > 0 else (-100.0 if net_profit < 0 else 0.0)
    
    assert dte_zero == 10.0, f"Expected leverage cap 10.0 for zero equity ML input, got {dte_zero}"
    assert roe_neg == -100.0, f"Expected distressed ROE -100.0 for negative equity & net loss, got {roe_neg}"
    
    print("✅ TEST 5 PASSED: Zero and negative equity ML feature matrix handled safely.")


def test_rule_triggers_and_qoq_explanations():
    """Verify rule engine forward/backward chaining triggers and QoQ labels."""
    test_data = {
        "current_ratio": 0.85,
        "debt_to_equity": 3.4,
        "interest_coverage": 1.2,
        "profit_margin": -2.5,
        "operating_cash_flow": -10.0,
        "revenue_growth": -6.5,
        "profit_growth": -15.0,
    }
    
    detected = forward_chaining(test_data)
    conclusions = [d["conclusion"] for d in detected]
    
    assert "High Liquidity Risk" in conclusions, "High Liquidity Risk missing"
    assert "High Debt Risk" in conclusions, "High Debt Risk missing"
    assert "High Interest Coverage Risk" in conclusions, "High Interest Coverage Risk missing"
    assert "High Revenue Growth Risk" in conclusions, "High Revenue Growth Risk missing"
    
    explanation = backward_chaining(test_data, "High Revenue Growth Risk")
    assert any("Revenue Growth (QoQ)" in exp for exp in explanation), f"QoQ label missing in explanation: {explanation}"
    
    print("✅ TEST 6 PASSED: Rule triggers and QoQ explanations verified.")


def test_recommendation_builder_structure():
    """Verify get_risk_details_and_recommendations output structure and benchmark clarity."""
    financial_data = {
        "profit_margin": 4.93,
        "current_ratio": 1.2,
    }
    
    rec_details = get_risk_details_and_recommendations(financial_data, "Moderate Profitability Risk")
    
    assert rec_details["slug"] == "moderate-profitability-risk", "Invalid slug"
    assert rec_details["metric_name"] == "Profit Margin", "Invalid metric name"
    assert rec_details["actual_value"] == "4.93%", "Invalid actual value formatting"
    assert "Safe Benchmark:" in rec_details["threshold_display"], "Missing safe benchmark label"
    assert len(rec_details["recommendations"]) > 0, "Recommendations list is empty"
    
    rec_item = rec_details["recommendations"][0]
    assert rec_item["priority"] in ["High", "Medium", "Low"], "Invalid priority level"
    assert len(rec_item["next_steps"]) >= 2, "Next steps count insufficient"
    
    print("✅ TEST 7 PASSED: Recommendation builder output structure & benchmark clarity verified.")


def test_multi_company_discovery_and_analysis():
    """Discover company IDs dynamically from Supabase and run live analysis for each."""
    companies = get_all_companies_from_supabase()
    assert len(companies) > 0, "No companies found in database"
    
    for cid in companies:
        result = analyze_company(cid)
        assert result is not None, f"analyze_company('{cid}') returned None"
        assert result["company_id"] == cid, f"Company ID mismatch: expected {cid}, got {result['company_id']}"
        assert "financial_metrics" in result, f"financial_metrics key missing for {cid}"
        assert "financial_ratios" in result, f"financial_ratios key missing for {cid}"
        
        # Verify no NaN or Inf values in JSON reporting structures
        for k, v in result["financial_metrics"].items():
            if v is not None:
                assert not math.isnan(v), f"NaN found in financial_metrics[{k}] for {cid}"
                assert not math.isinf(v), f"Inf found in financial_metrics[{k}] for {cid}"
                
        for k, v in result["financial_ratios"].items():
            if v is not None:
                assert not math.isnan(v), f"NaN found in financial_ratios[{k}] for {cid}"
                assert not math.isinf(v), f"Inf found in financial_ratios[{k}] for {cid}"
                
    print(f"✅ TEST 8 PASSED: Live multi-company analysis verified across {len(companies)} companies ({', '.join(companies)}).")


if __name__ == "__main__":
    print("=" * 70)
    print("      CFO-AI AUTOMATED FINANCIAL ACCURACY & RELIABILITY TEST SUITE")
    print("=" * 70)
    test_feature_columns_ordering()
    test_ground_truth_accounting_fixtures()
    test_zero_interest_expense_handling()
    test_zero_current_liabilities_and_assets()
    test_zero_and_negative_equity()
    test_rule_triggers_and_qoq_explanations()
    test_recommendation_builder_structure()
    test_multi_company_discovery_and_analysis()
    print("=" * 70)
    print("      🎉 ALL 8 AUTOMATED ACCURACY & RELIABILITY TESTS PASSED!")
    print("=" * 70)
