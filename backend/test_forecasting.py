"""
SMART CFO — COMPREHENSIVE FORECASTING TEST & EVALUATION SUITE

Covers all 10 required test verification cases:
1. Company with increasing revenue (e.g., C001 live DB)
2. Company with declining revenue
3. Company with relatively stable revenue (e.g., C002 live DB)
4. Company with insufficient history (< 5 quarters)
5. Company with missing quarters and duplicate quarter records
6. Two different company IDs yielding distinct historical and forecast outputs
7. YoY growth above +15% (verifying upper cap enforcement)
8. YoY growth below -10% (verifying lower cap enforcement)
9. Company with zero previous-year revenue (division by zero safety)
10. Non-existent company ID (verifying 404 error handling)

Plus:
- Time-ordered validation & synthetic dataset backtest (MAPE and Directional Accuracy)
- Horizon-by-horizon telemetry (Q+1 to Q+4)
- Quarter boundaries and transition logic
"""

import os
import sys
import unittest
import numpy as np
from pathlib import Path

# Setup paths
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cfo_backend.settings")
import django
django.setup()

from django.test import Client
from api.forecasting import (
    generate_company_revenue_forecast,
    calculate_yoy_growth,
    generate_four_quarter_forecast,
    classify_forecast_trend,
    validate_historical_data,
    parse_quarter,
    format_quarter,
    add_quarters,
    same_quarter_previous_year,
)


class TestForecastingEngine(unittest.TestCase):

    def setUp(self):
        self.client = Client()

    # ========================================================================
    # TEST 1: Company with Generally Increasing Revenue (Live C001)
    # ========================================================================
    def test_01_increasing_revenue_company(self):
        res = generate_company_revenue_forecast("C001")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["company_id"], "C001")
        self.assertEqual(res["trend"], "Increasing")
        self.assertGreater(res["forecast_change_percent"], 3.0)
        self.assertGreater(res["forecast"][-1]["revenue"], res["forecast"][0]["revenue"])
        self.assertEqual(len(res["forecast"]), 4)
        # Verify next quarters are 2027-Q1 .. 2027-Q4
        expected_quarters = ["2027-Q1", "2027-Q2", "2027-Q3", "2027-Q4"]
        actual_quarters = [f["quarter"] for f in res["forecast"]]
        self.assertEqual(actual_quarters, expected_quarters)
        print("[PASS] Test 1: C001 Increasing trend verified.")

    # ========================================================================
    # TEST 2: Company with Generally Declining Revenue (Synthetic)
    # ========================================================================
    def test_02_declining_revenue_company(self):
        records = [
            {"quarter": "2025Q1", "revenue_cr": 200.0},
            {"quarter": "2025Q2", "revenue_cr": 190.0},
            {"quarter": "2025Q3", "revenue_cr": 180.0},
            {"quarter": "2025Q4", "revenue_cr": 170.0},
            {"quarter": "2026Q1", "revenue_cr": 185.0},
            {"quarter": "2026Q2", "revenue_cr": 172.0},
            {"quarter": "2026Q3", "revenue_cr": 160.0},
            {"quarter": "2026Q4", "revenue_cr": 150.0}, # YoY vs 2025Q4: (150-170)/170 = -11.76% -> capped at -10%
        ]
        res = generate_company_revenue_forecast("TEST_DECLINE", custom_records=records, custom_company_name="Declining Enterprises")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["trend"], "Declining")
        self.assertLess(res["forecast_change_percent"], -3.0)
        self.assertLess(res["forecast"][-1]["revenue"], res["forecast"][0]["revenue"])
        print("[PASS] Test 2: Declining trend verified.")

    # ========================================================================
    # TEST 3: Company with Relatively Stable Revenue (Live C002)
    # ========================================================================
    def test_03_stable_revenue_company(self):
        res = generate_company_revenue_forecast("C002")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["company_id"], "C002")
        self.assertEqual(res["trend"], "Stable")
        self.assertTrue(-3.0 <= res["forecast_change_percent"] <= 3.0)
        print("[PASS] Test 3: C002 Stable trend verified.")

    # ========================================================================
    # TEST 4: Company with Insufficient History (< 5 quarters)
    # ========================================================================
    def test_04_insufficient_history(self):
        records = [
            {"quarter": "2026Q1", "revenue_cr": 100.0},
            {"quarter": "2026Q2", "revenue_cr": 105.0},
            {"quarter": "2026Q3", "revenue_cr": 110.0},
        ]
        with self.assertRaises(ValueError) as ctx:
            generate_company_revenue_forecast("TEST_SHORT", custom_records=records)
        error_dict = ctx.exception.args[0]
        self.assertEqual(error_dict["error_type"], "INSUFFICIENT_HISTORY")
        print("[PASS] Test 4: Insufficient history correctly blocked.")

    # ========================================================================
    # TEST 5: Missing or Duplicate Quarters
    # ========================================================================
    def test_05_missing_or_duplicate_quarters(self):
        # 5a: Duplicate quarter
        dup_records = [
            {"quarter": "2025Q1", "revenue_cr": 100.0},
            {"quarter": "2025Q2", "revenue_cr": 105.0},
            {"quarter": "2025Q2", "revenue_cr": 107.0}, # Duplicate
            {"quarter": "2025Q3", "revenue_cr": 110.0},
            {"quarter": "2025Q4", "revenue_cr": 115.0},
            {"quarter": "2026Q1", "revenue_cr": 120.0},
        ]
        with self.assertRaises(ValueError) as ctx1:
            generate_company_revenue_forecast("TEST_DUP", custom_records=dup_records)
        self.assertEqual(ctx1.exception.args[0]["error_type"], "DUPLICATE_QUARTER")

        # 5b: Missing seasonal baseline quarter (missing 2025Q3)
        missing_records = [
            {"quarter": "2025Q1", "revenue_cr": 100.0},
            {"quarter": "2025Q2", "revenue_cr": 105.0},
            # Missing 2025Q3!
            {"quarter": "2025Q4", "revenue_cr": 115.0},
            {"quarter": "2026Q1", "revenue_cr": 120.0},
            {"quarter": "2026Q2", "revenue_cr": 125.0},
        ]
        with self.assertRaises(ValueError) as ctx2:
            generate_company_revenue_forecast("TEST_MISSING", custom_records=missing_records)
        self.assertEqual(ctx2.exception.args[0]["error_type"], "MISSING_SEASONAL_BASELINES")
        print("[PASS] Test 5: Duplicate and missing quarter validations verified.")

    # ========================================================================
    # TEST 6: Two Different Company IDs with Different Revenue
    # ========================================================================
    def test_06_two_different_companies(self):
        res1 = generate_company_revenue_forecast("C001")
        res2 = generate_company_revenue_forecast("C002")

        self.assertNotEqual(res1["company_id"], res2["company_id"])
        self.assertNotEqual(res1["latest_revenue"], res2["latest_revenue"])
        self.assertNotEqual(res1["capped_growth_percent"], res2["capped_growth_percent"])
        self.assertNotEqual(res1["forecast"][0]["revenue"], res2["forecast"][0]["revenue"])
        self.assertNotEqual(res1["trend"], res2["trend"])
        print("[PASS] Test 6: Dynamic company differentiation verified.")

    # ========================================================================
    # TEST 7: Calculated YoY Growth Above +15% (Upper Cap Enforced)
    # ========================================================================
    def test_07_upper_growth_cap_above_15(self):
        # Raw YoY = (200 - 100)/100 = +100%
        raw_yoy, capped_yoy = calculate_yoy_growth(200.0, 100.0)
        self.assertEqual(raw_yoy, 100.0)
        self.assertEqual(capped_yoy, 15.0)

        # In full pipeline
        records = [
            {"quarter": "2025Q1", "revenue_cr": 100.0},
            {"quarter": "2025Q2", "revenue_cr": 100.0},
            {"quarter": "2025Q3", "revenue_cr": 100.0},
            {"quarter": "2025Q4", "revenue_cr": 100.0},
            {"quarter": "2026Q1", "revenue_cr": 150.0},
            {"quarter": "2026Q2", "revenue_cr": 160.0},
            {"quarter": "2026Q3", "revenue_cr": 170.0},
            {"quarter": "2026Q4", "revenue_cr": 250.0}, # YoY vs 2025Q4 = +150%
        ]
        res = generate_company_revenue_forecast("TEST_BOOM", custom_records=records)
        self.assertEqual(res["latest_yoy_growth_percent"], 150.0)
        self.assertEqual(res["capped_growth_percent"], 15.0)
        # 2027Q1 forecast should be 2026Q1 (150) * 1.15 = 172.5
        self.assertEqual(res["forecast"][0]["revenue"], 172.5)
        print("[PASS] Test 7: Upper growth cap (+15.0%) enforced.")

    # ========================================================================
    # TEST 8: Calculated YoY Growth Below -10% (Lower Cap Enforced)
    # ========================================================================
    def test_08_lower_growth_cap_below_minus_10(self):
        # Raw YoY = (50 - 100)/100 = -50%
        raw_yoy, capped_yoy = calculate_yoy_growth(50.0, 100.0)
        self.assertEqual(raw_yoy, -50.0)
        self.assertEqual(capped_yoy, -10.0)

        # In full pipeline
        records = [
            {"quarter": "2025Q1", "revenue_cr": 100.0},
            {"quarter": "2025Q2", "revenue_cr": 100.0},
            {"quarter": "2025Q3", "revenue_cr": 100.0},
            {"quarter": "2025Q4", "revenue_cr": 100.0},
            {"quarter": "2026Q1", "revenue_cr": 80.0},
            {"quarter": "2026Q2", "revenue_cr": 80.0},
            {"quarter": "2026Q3", "revenue_cr": 80.0},
            {"quarter": "2026Q4", "revenue_cr": 60.0}, # YoY vs 2025Q4 = -40%
        ]
        res = generate_company_revenue_forecast("TEST_CRASH", custom_records=records)
        self.assertEqual(res["latest_yoy_growth_percent"], -40.0)
        self.assertEqual(res["capped_growth_percent"], -10.0)
        # 2027Q1 forecast should be 2026Q1 (80) * 0.90 = 72.0
        self.assertEqual(res["forecast"][0]["revenue"], 72.0)
        print("[PASS] Test 8: Lower growth cap (-10.0%) enforced.")

    # ========================================================================
    # TEST 9: Zero or Negative Previous-Year Revenue
    # ========================================================================
    def test_09_zero_previous_year_revenue(self):
        records = [
            {"quarter": "2025Q1", "revenue_cr": 100.0},
            {"quarter": "2025Q2", "revenue_cr": 100.0},
            {"quarter": "2025Q3", "revenue_cr": 100.0},
            {"quarter": "2025Q4", "revenue_cr": 0.0}, # Zero baseline!
            {"quarter": "2026Q1", "revenue_cr": 50.0},
            {"quarter": "2026Q2", "revenue_cr": 60.0},
            {"quarter": "2026Q3", "revenue_cr": 70.0},
            {"quarter": "2026Q4", "revenue_cr": 80.0},
        ]
        with self.assertRaises(ValueError) as ctx:
            generate_company_revenue_forecast("TEST_ZERO", custom_records=records)
        self.assertEqual(ctx.exception.args[0]["error_type"], "ZERO_BASELINE_REVENUE")
        print("[PASS] Test 9: Zero baseline revenue handled safely.")

    # ========================================================================
    # TEST 10: Non-Existent Company ID (404 Handling)
    # ========================================================================
    def test_10_non_existent_company_api_404(self):
        response = self.client.get("/api/forecast/NON_EXISTENT_CO_9999/")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertEqual(data["error"], "Company not found")

        # Also verify alternative route
        alt_response = self.client.get("/api/company/NON_EXISTENT_CO_9999/forecast/")
        self.assertEqual(alt_response.status_code, 404)
        print("[PASS] Test 10: 404 returned for non-existent company.")

    # ========================================================================
    # TEST 11: Quarter Boundary Transition Logic
    # ========================================================================
    def test_11_quarter_boundary_transitions(self):
        # From Q4 to Q1 of next year
        y, q = add_quarters(2026, 4, 1)
        self.assertEqual((y, q), (2027, 1))

        # From Q2, adding 3 quarters -> Q1 of next year
        y, q = add_quarters(2026, 2, 3)
        self.assertEqual((y, q), (2027, 1))

        # Adding 4 quarters -> same quarter next year
        y, q = add_quarters(2025, 3, 4)
        self.assertEqual((y, q), (2026, 3))

        # Same quarter previous year
        y, q = same_quarter_previous_year(2027, 1)
        self.assertEqual((y, q), (2026, 1))
        print("[PASS] Test 11: Quarter boundary transitions verified.")

    # ========================================================================
    # TEST 12: Synthetic Cohort Backtest Simulation (500 companies x 4 quarters)
    # ========================================================================
    def test_12_synthetic_backtest_simulation(self):
        """
        Validates the Seasonal + Trend Baseline method across 500 simulated companies
        comprising 2,000 forecast points across growing, declining, and stable trajectories.
        Computes MAPE and Directional Accuracy.
        """
        np.random.seed(42)
        num_companies = 500
        quarters_count = 12 # 8 historical, 4 ground-truth test quarters

        seasonal_factors = np.array([0.95, 0.98, 1.02, 1.05])
        all_apes = []
        directional_matches = 0
        horizon_apes = {1: [], 2: [], 3: [], 4: []}

        for i in range(num_companies):
            # Mix of growth archetypes: 40% growing, 30% stable, 30% declining
            rand_type = np.random.rand()
            if rand_type < 0.40:
                annual_drift = np.random.uniform(0.04, 0.14) # Growing
            elif rand_type < 0.70:
                annual_drift = np.random.uniform(-0.02, 0.03) # Stable
            else:
                annual_drift = np.random.uniform(-0.12, -0.04) # Declining

            base_revenue = np.random.uniform(50.0, 500.0)

            # Generate synthetic series with noise
            revenues = []
            for t in range(quarters_count):
                year_offset = t // 4
                q_idx = t % 4
                trend_factor = (1.0 + annual_drift) ** year_offset
                seasonality = seasonal_factors[q_idx]
                noise = np.random.normal(0, 0.03) # 3% quarterly noise
                rev = max(5.0, base_revenue * trend_factor * seasonality * (1.0 + noise))
                revenues.append(rev)

            # First 8 quarters are historical (2024Q1..2025Q4)
            # Last 4 quarters are ground-truth actuals for 2026Q1..2026Q4
            historical_records = [
                {"quarter": f"{2024 + (t // 4)}Q{(t % 4) + 1}", "revenue_cr": round(revenues[t], 2)}
                for t in range(8)
            ]
            actual_test = [revenues[t] for t in range(8, 12)]

            # Forecast using our engine
            res = generate_company_revenue_forecast(
                f"SIM_{i}",
                custom_records=historical_records
            )
            forecast_vals = [f["revenue"] for f in res["forecast"]]

            # Directional accuracy test: does forecast direction match actual ground truth direction?
            actual_dir = np.sign(actual_test[-1] - actual_test[0])
            pred_dir = np.sign(forecast_vals[-1] - forecast_vals[0])
            if actual_dir == pred_dir or actual_dir == 0:
                directional_matches += 1

            for h in range(4):
                ape = abs(actual_test[h] - forecast_vals[h]) / actual_test[h] * 100.0
                all_apes.append(ape)
                horizon_apes[h + 1].append(ape)

        overall_mape = np.mean(all_apes)
        dir_accuracy = (directional_matches / num_companies) * 100.0

        print("\n=======================================================")
        print("SYNTHETIC BACKTEST RESULTS (500 Companies / 2,000 Points)")
        print("=======================================================")
        print(f"Overall Benchmark MAPE:        {overall_mape:.2f}%")
        print(f"Directional Accuracy:         {dir_accuracy:.1f}%")
        for h in range(1, 5):
            print(f"  Horizon Q+{h} MAPE:           {np.mean(horizon_apes[h]):.2f}%")
        print("=======================================================\n")

        self.assertLess(overall_mape, 10.0) # Confirms realistic error within target bounds
        self.assertGreater(dir_accuracy, 88.0) # Confirms strong directional concordancy
        print("[PASS] Test 12: Synthetic cohort backtest simulation validated.")


if __name__ == "__main__":
    unittest.main()
