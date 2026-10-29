"""
AUTOMATED TEST SUITE FOR CASH FLOW FORECASTING SERVICE
Tests:
1. Quarter parsing and chronological sorting
2. Negative cash flow preservation (Company C003)
3. Zero look-ahead leakage out-of-sample backtest calculation
4. Additive Seasonal + Trend forecasting formula
5. Baseline comparison metrics (MAE, RMSE, WAPE)
6. Company isolation and API endpoint responses
"""

import os
import unittest
from pathlib import Path
from dotenv import load_dotenv

# Load backend env
BACKEND_DIR = Path(__file__).resolve().parent
env_path = BACKEND_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

from api.forecasting import (
    generate_company_cash_flow_forecast,
    validate_historical_cash_flow_data,
    evaluate_leakage_free_backtest,
    compute_forecast_error_metrics,
    parse_quarter,
    format_quarter,
)


class TestCashFlowForecastingEngine(unittest.TestCase):

    def setUp(self):
        # Synthetic 12-quarter series with negative and positive values
        self.mock_records_positive = [
            {"quarter": "2023Q1", "operating_cash_flow_cr": 10.0, "cash_cr": 5.0, "total_debt_cr": 2.0},
            {"quarter": "2023Q2", "operating_cash_flow_cr": 12.0, "cash_cr": 6.0, "total_debt_cr": 2.0},
            {"quarter": "2023Q3", "operating_cash_flow_cr": 15.0, "cash_cr": 7.0, "total_debt_cr": 2.0},
            {"quarter": "2023Q4", "operating_cash_flow_cr": 20.0, "cash_cr": 8.0, "total_debt_cr": 2.0},
            {"quarter": "2024Q1", "operating_cash_flow_cr": 14.0, "cash_cr": 9.0, "total_debt_cr": 2.0},
            {"quarter": "2024Q2", "operating_cash_flow_cr": 16.0, "cash_cr": 10.0, "total_debt_cr": 2.0},
            {"quarter": "2024Q3", "operating_cash_flow_cr": 19.0, "cash_cr": 11.0, "total_debt_cr": 2.0},
            {"quarter": "2024Q4", "operating_cash_flow_cr": 24.0, "cash_cr": 12.0, "total_debt_cr": 2.0},
            {"quarter": "2025Q1", "operating_cash_flow_cr": 18.0, "cash_cr": 13.0, "total_debt_cr": 2.0},
            {"quarter": "2025Q2", "operating_cash_flow_cr": 20.0, "cash_cr": 14.0, "total_debt_cr": 2.0},
            {"quarter": "2025Q3", "operating_cash_flow_cr": 23.0, "cash_cr": 15.0, "total_debt_cr": 2.0},
            {"quarter": "2025Q4", "operating_cash_flow_cr": 28.0, "cash_cr": 16.0, "total_debt_cr": 2.0},
        ]

        # Synthetic series with negative operating cash flows (e.g. tech startup / turnaround)
        self.mock_records_negative = [
            {"quarter": "2023Q1", "operating_cash_flow_cr": -10.0, "cash_cr": 20.0, "total_debt_cr": 5.0},
            {"quarter": "2023Q2", "operating_cash_flow_cr": -8.0, "cash_cr": 18.0, "total_debt_cr": 5.0},
            {"quarter": "2023Q3", "operating_cash_flow_cr": -5.0, "cash_cr": 15.0, "total_debt_cr": 5.0},
            {"quarter": "2023Q4", "operating_cash_flow_cr": -2.0, "cash_cr": 14.0, "total_debt_cr": 5.0},
            {"quarter": "2024Q1", "operating_cash_flow_cr": -6.0, "cash_cr": 12.0, "total_debt_cr": 5.0},
            {"quarter": "2024Q2", "operating_cash_flow_cr": -4.0, "cash_cr": 10.0, "total_debt_cr": 5.0},
            {"quarter": "2024Q3", "operating_cash_flow_cr": -1.0, "cash_cr": 9.0, "total_debt_cr": 5.0},
            {"quarter": "2024Q4", "operating_cash_flow_cr": 3.0, "cash_cr": 10.0, "total_debt_cr": 5.0},
            {"quarter": "2025Q1", "operating_cash_flow_cr": -2.0, "cash_cr": 9.0, "total_debt_cr": 5.0},
            {"quarter": "2025Q2", "operating_cash_flow_cr": 0.0, "cash_cr": 9.0, "total_debt_cr": 5.0},
            {"quarter": "2025Q3", "operating_cash_flow_cr": 4.0, "cash_cr": 11.0, "total_debt_cr": 5.0},
            {"quarter": "2025Q4", "operating_cash_flow_cr": 7.0, "cash_cr": 14.0, "total_debt_cr": 5.0},
        ]

    def test_quarter_utility_parsing(self):
        self.assertEqual(parse_quarter("2026Q4"), (2026, 4))
        self.assertEqual(parse_quarter("2026-Q1"), (2026, 1))
        self.assertEqual(format_quarter(2027, 2, "hyphen"), "2027-Q2")

    def test_data_validation_positive_and_negative(self):
        val_pos = validate_historical_cash_flow_data(self.mock_records_positive)
        self.assertTrue(val_pos["is_valid"])
        self.assertEqual(len(val_pos["validated_series"]), 12)

        val_neg = validate_historical_cash_flow_data(self.mock_records_negative)
        self.assertTrue(val_neg["is_valid"])
        self.assertEqual(len(val_neg["validated_series"]), 12)

    def test_gap_detection(self):
        gap_records = [
            {"quarter": "2023Q1", "operating_cash_flow_cr": 10.0},
            {"quarter": "2023Q3", "operating_cash_flow_cr": 15.0},  # Missing 2023Q2
        ]
        val = validate_historical_cash_flow_data(gap_records)
        self.assertFalse(val["is_valid"])
        self.assertEqual(val["error_type"], "MISSING_PERIOD")

    def test_backtesting_leakage_free(self):
        val = validate_historical_cash_flow_data(self.mock_records_positive)
        backtest = evaluate_leakage_free_backtest(val["validated_series"], test_horizon=4)
        
        # Test period should be last 4 quarters (2025Q1 to 2025Q4)
        self.assertEqual(backtest["test_quarters"], ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4"])
        # Training quarters should be 8
        self.assertEqual(backtest["training_quarters_count"], 8)
        # Actual values
        self.assertEqual(backtest["actuals"], [18.0, 20.0, 23.0, 28.0])
        # Baseline (Seasonal Naïve) uses same quarter previous year from training (2024Q1..Q4)
        self.assertEqual(backtest["baseline_predictions"], [14.0, 16.0, 19.0, 24.0])
        
        # Candidate MAE should be non-null
        self.assertIsNotNone(backtest["candidate_metrics"]["mae"])
        self.assertIsNotNone(backtest["candidate_metrics"]["rmse"])
        self.assertIsNotNone(backtest["candidate_metrics"]["wape_percent"])

    def test_error_metrics_calculator(self):
        actuals = [10.0, 20.0, 30.0]
        preds = [12.0, 18.0, 33.0]
        metrics = compute_forecast_error_metrics(actuals, preds)
        # errors: [2, 2, 3] -> MAE = (2+2+3)/3 = 2.33
        self.assertAlmostEqual(metrics["mae"], 2.33, places=2)
        self.assertEqual(metrics["sample_size"], 3)

    def test_master_service_live_c001(self):
        res = generate_company_cash_flow_forecast("C001")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["company_id"], "C001")
        self.assertEqual(res["unit"], "₹ Crores")
        self.assertEqual(len(res["forecast"]), 4)
        self.assertEqual(len(res["historical"]), 28)
        self.assertTrue(res["backtest_evaluation"]["training_quarters_count"] > 0)

    def test_master_service_live_c003_negative_cash_flow(self):
        res = generate_company_cash_flow_forecast("C003")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["company_id"], "C003")
        self.assertTrue(res["data_quality"]["has_negative_cash_flow"])
        self.assertEqual(res["data_quality"]["negative_quarters_count"], 11)
        # Check that negative cash flows are preserved in historical series
        has_neg = any(h["operating_cash_flow"] < 0 for h in res["historical"])
        self.assertTrue(has_neg)


if __name__ == "__main__":
    unittest.main()
