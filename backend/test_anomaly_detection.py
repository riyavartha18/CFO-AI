import os
import unittest
import django
from django.test import RequestFactory

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cfo_backend.settings')
django.setup()

from anomaly import analyze_anomalies_for_company, get_single_record_anomaly_details
from api.views import anomaly_overview_view, anomaly_scan_view, anomaly_detail_view


class TestAnomalyDetection(unittest.TestCase):

    def test_analyze_anomalies_c001(self):
        result = analyze_anomalies_for_company("C001")
        self.assertIn("summary", result)
        self.assertIn("records", result)
        self.assertIn("charts_data", result)
        self.assertIn("metrics_summary", result)
        self.assertGreater(result["summary"]["total_records"], 0)
        self.assertEqual(result["company_info"]["company_id"], "C001")

        # Verify summary cards calculation rules
        ms = result["metrics_summary"]
        self.assertIn("total_metrics", ms)
        self.assertIn("normal_metrics_count", ms)
        self.assertIn("unusual_metrics_count", ms)
        self.assertIn("review_metrics_count", ms)

        # Rule 1: Total Metrics = Normal Metrics + Unusual Metrics + Metrics Requiring Review
        self.assertEqual(
            ms["total_metrics"],
            ms["normal_metrics_count"] + ms["unusual_metrics_count"] + ms["review_metrics_count"]
        )

        # Rule 2: Percentage verification
        if ms["total_metrics"] > 0:
            expected_normal_pct = round((ms["normal_metrics_count"] / ms["total_metrics"]) * 100.0, 1)
            expected_unusual_pct = round((ms["unusual_metrics_count"] / ms["total_metrics"]) * 100.0, 1)
            expected_review_pct = round((ms["review_metrics_count"] / ms["total_metrics"]) * 100.0, 1)
            self.assertEqual(ms["normal_metrics_percentage"], expected_normal_pct)
            self.assertEqual(ms["unusual_metrics_percentage"], expected_unusual_pct)
            self.assertEqual(ms["review_metrics_percentage"], expected_review_pct)

    def test_anomaly_overview_api(self):
        rf = RequestFactory()
        req = rf.get('/api/anomaly-detection/overview/?company_id=C001')
        resp = anomaly_overview_view(req)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("records", resp.data)
        self.assertIn("summary", resp.data)
        self.assertIn("metrics_summary", resp.data)
        ms = resp.data["metrics_summary"]
        self.assertEqual(
            ms["total_metrics"],
            ms["normal_metrics_count"] + ms["unusual_metrics_count"] + ms["review_metrics_count"]
        )

    def test_anomaly_scan_api(self):
        rf = RequestFactory()
        req = rf.post('/api/anomaly-detection/scan/', data={"company_id": "C001"}, content_type="application/json")
        resp = anomaly_scan_view(req)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("summary", resp.data)

    def test_anomaly_detail_api(self):
        overview = analyze_anomalies_for_company("C001")
        first_id = overview["records"][0]["record_id"]

        rf = RequestFactory()
        req = rf.get(f'/api/anomaly-detection/detail/{first_id}/?feature_key=operating_expenses')
        resp = anomaly_detail_view(req, record_id=first_id)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("parameter", resp.data)
        self.assertIn("historical_trend", resp.data)
        self.assertEqual(resp.data["parameter"]["feature_key"], "operating_expenses")


if __name__ == '__main__':
    unittest.main()
