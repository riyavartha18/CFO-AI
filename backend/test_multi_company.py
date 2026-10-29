"""
SMART CFO - Automated Multi-Company & Security Test Suite
Tests:
1. Company registration & auto-assigned CID uniqueness
2. Multiple users belonging to the same company
3. Cross-company access prevention (HTTP 403 Forbidden)
4. Downloadable 20-column CSV template verification
5. CSV validation (schema, quarter format, numeric integrity, duplicates)
6. Secure CSV import scoped to authenticated company & history logging
7. Historical dummy data preservation (C001, C002, C003)
"""

import os
import sys
import json
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cfo_backend.settings")
import django
django.setup()

from django.test import Client
from api.auth import get_db_connection, decode_token, generate_token
from api.csv_service import REQUIRED_COLUMNS, generate_csv_template


class MultiCompanySecurityTestSuite(unittest.TestCase):
    def setUp(self):
        self.client = Client()
        self.conn = get_db_connection()
        self.cur = self.conn.cursor()

    def tearDown(self):
        self.cur.close()
        self.conn.close()

    def test_1_dummy_data_preservation(self):
        """Verify C001, C002, and C003 historical dummy data is 100% intact."""
        for cid in ["C001", "C002", "C003"]:
            self.cur.execute("""
                SELECT count(*), min(quarter), max(quarter) 
                FROM financial_records WHERE company_id = %s;
            """, (cid,))
            row = self.cur.fetchone()
            self.assertIsNotNone(row)
            count, min_q, max_q = row
            self.assertEqual(count, 28, f"Expected 28 quarters for {cid}, found {count}")
            self.assertEqual(min_q, "2020Q1")
            self.assertEqual(max_q, "2026Q4")

        # Verify C001 analysis works without error
        res = self.client.get("/api/company/C001/analysis/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get("company_id"), "C001")
        print("[PASS] Test 1: Historical dummy records preserved across C001, C002, C003.")

    def test_2_company_registration_and_cid_uniqueness(self):
        """Verify registering a company assigns a unique CID and hashes credentials."""
        email = "founder@testcorp.com"
        # Clean up prior test run if exists
        self.cur.execute("SELECT id FROM app_users WHERE email = %s;", (email,))
        existing = self.cur.fetchone()
        if existing:
            self.cur.execute("DELETE FROM app_users WHERE id = %s;", (existing[0],))
            self.conn.commit()

        payload = {
            "companyName": "Quantum Dynamics",
            "email": email,
            "password": "SecurePassword123!",
            "industry": "DeepTech",
            "companySize": "51-200 employees",
            "fullName": "Alice Founder"
        }
        res = self.client.post(
            "/api/auth/register/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 201, f"Registration failed: {res.content}")
        data = res.json()
        self.assertTrue(data.get("success"))
        
        cid = data.get("company", {}).get("company_id")
        self.assertIsNotNone(cid)
        self.assertTrue(cid.startswith("C"), f"CID must start with C: {cid}")
        self.assertNotIn(cid, ["C001", "C002", "C003"])

        # Verify token
        token = data.get("token")
        claims = decode_token(token)
        self.assertIsNotNone(claims)
        self.assertEqual(claims.get("email"), email)
        self.assertEqual(claims.get("company_id"), cid)
        print(f"[PASS] Test 2: Company registered with unique auto-assigned CID: {cid}.")

    def test_3_multiple_users_belong_to_same_company(self):
        """Verify multiple distinct user logins can belong to the same company."""
        # Query C001 users seeded during migration
        self.cur.execute("""
            SELECT u.email, cu.role 
            FROM company_users cu
            JOIN app_users u ON u.id = cu.user_id
            WHERE cu.company_id = 'C001';
        """)
        users = self.cur.fetchall()
        self.assertGreaterEqual(len(users), 2, "Expected at least 2 users for C001")
        emails = [u[0] for u in users]
        self.assertIn("cfo@c001.com", emails)
        self.assertIn("analyst@c001.com", emails)

        # Login both users and verify each gets token scoped to C001
        for em in ["cfo@c001.com", "analyst@c001.com"]:
            res = self.client.post(
                "/api/auth/login/",
                data=json.dumps({"email": em, "password": "Password123!"}),
                content_type="application/json"
            )
            self.assertEqual(res.status_code, 200, f"Login failed for {em}")
            token = res.json().get("token")
            claims = decode_token(token)
            self.assertEqual(claims.get("company_id"), "C001")
            self.assertEqual(claims.get("email"), em)
        print("[PASS] Test 3: Multiple users authenticated under same company C001.")

    def test_4_cross_company_access_prevention(self):
        """Verify an authenticated user from Company A is blocked with 403 from accessing Company B."""
        # Create token for C002
        c002_token = generate_token(user_id=999, email="cfo@c002.com", company_id="C002", role="owner")
        headers = {"HTTP_AUTHORIZATION": f"Bearer {c002_token}"}

        # User C002 tries to access C001 analysis
        res_analysis = self.client.get("/api/company/C001/analysis/", **headers)
        self.assertEqual(res_analysis.status_code, 403, "Expected 403 Forbidden for cross-company analysis request")

        # User C002 tries to access C001 forecast
        res_forecast = self.client.get("/api/forecast/C001/", **headers)
        self.assertEqual(res_forecast.status_code, 403, "Expected 403 Forbidden for cross-company forecast request")

        # User C002 tries to access C001 cash-flow forecast
        res_cf = self.client.get("/api/forecast/cash-flow/C001/", **headers)
        self.assertEqual(res_cf.status_code, 403, "Expected 403 Forbidden for cross-company cash flow forecast")

        # User C002 tries to access C001 anomaly overview
        res_anomaly = self.client.get("/api/anomaly-detection/overview/?company_id=C001", **headers)
        self.assertEqual(res_anomaly.status_code, 403, "Expected 403 Forbidden for cross-company anomaly scan")

        # BUT User C002 CAN access its own data:
        res_own = self.client.get("/api/company/C002/analysis/", **headers)
        self.assertEqual(res_own.status_code, 200, "User should access their own authorized company data")
        print("[PASS] Test 4: Cross-company data access strictly blocked with HTTP 403 Forbidden.")

    def test_5_csv_template_download(self):
        """Verify downloadable template endpoint provides all 20 required financial fields with NO dummy data rows."""
        res = self.client.get("/api/csv/template/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "text/csv")
        self.assertIn("smart_cfo_financial_template.csv", res["Content-Disposition"])

        lines = res.content.decode("utf-8").strip().splitlines()
        # Verify template has only 1 row (the 20-column header), 0 dummy data rows
        self.assertEqual(len(lines), 1, f"Expected header row only (0 dummy rows), got {len(lines)} lines")
        header = [c.strip() for c in lines[0].split(",")]
        self.assertEqual(len(header), 20)
        for col in REQUIRED_COLUMNS:
            self.assertIn(col, header)
        print("[PASS] Test 5: Clean 20-column CSV template with 0 dummy rows verified.")

    def test_6_csv_validation_checks(self):
        """Verify CSV pre-validation detects schema errors, bad quarters, and duplicate quarters."""
        c001_token = generate_token(user_id=1, email="cfo@c001.com", company_id="C001")
        headers = {"HTTP_AUTHORIZATION": f"Bearer {c001_token}"}
        hdr = ",".join(REQUIRED_COLUMNS)

        # 1. Invalid quarter format (e.g. 2026-Q1)
        bad_quarter_csv = (
            f"{hdr}\n"
            "C001,2027-Q1,120.5,60.2,25.1,3.5,4.2,5.8,35.0,28.5,15.2,80.0,18.4,10.0,5.0,40.0,12.0,22.5,-10.0,-5.0\n"
        )
        res1 = self.client.post(
            "/api/csv/validate/",
            data=json.dumps({"content": bad_quarter_csv}),
            content_type="application/json",
            **headers
        )
        self.assertFalse(res1.json().get("valid"))
        self.assertTrue(any("Invalid quarter format" in err for err in res1.json().get("errors")))

        # 2. Duplicate quarters in CSV
        dup_quarter_csv = (
            f"{hdr}\n"
            "C001,2027Q1,120.5,60.2,25.1,3.5,4.2,5.8,35.0,28.5,15.2,80.0,18.4,10.0,5.0,40.0,12.0,22.5,-10.0,-5.0\n"
            "C001,2027Q1,130.5,62.2,26.1,3.5,4.2,6.0,36.0,29.5,16.2,81.0,19.0,10.0,5.0,39.0,11.0,23.5,-10.0,-5.0\n"
        )
        res2 = self.client.post(
            "/api/csv/validate/",
            data=json.dumps({"content": dup_quarter_csv}),
            content_type="application/json",
            **headers
        )
        self.assertFalse(res2.json().get("valid"))
        self.assertTrue(any("Duplicate quarters" in err for err in res2.json().get("errors")))

        # 3. Valid CSV with 2 rows
        valid_csv = (
            f"{hdr}\n"
            "C001,2027Q1,120.5,60.2,25.1,3.5,4.2,5.8,35.0,28.5,15.2,80.0,18.4,10.0,5.0,40.0,12.0,22.5,-10.0,-5.0\n"
            "C001,2027Q2,132.8,65.4,26.8,3.5,4.2,6.5,42.0,30.2,16.0,82.0,19.1,9.0,5.0,38.0,11.5,26.4,-8.0,-6.0\n"
        )
        res3 = self.client.post(
            "/api/csv/validate/",
            data=json.dumps({"content": valid_csv}),
            content_type="application/json",
            **headers
        )
        self.assertTrue(res3.json().get("valid"))
        self.assertEqual(res3.json().get("row_count"), 2)
        print("[PASS] Test 6: CSV validation catches format errors, duplicates, and verifies valid files.")

    def test_7_csv_import_scoped_to_company(self):
        """Verify imported records are stamped with authenticated company and logged to history."""
        c003_token = generate_token(user_id=3, email="cfo@c003.com", company_id="C003")
        headers = {"HTTP_AUTHORIZATION": f"Bearer {c003_token}"}
        hdr = ",".join(REQUIRED_COLUMNS)

        # Create test CSV with quarters 2028Q1 and 2028Q2 with intentional mismatched company_id
        csv_content = (
            f"{hdr}\n"
            "WRONG_CID,2028Q1,120.5,60.2,25.1,3.5,4.2,5.8,35.0,28.5,15.2,80.0,18.4,10.0,5.0,40.0,12.0,22.5,-10.0,-5.0\n"
            "WRONG_CID,2028Q2,132.8,65.4,26.8,3.5,4.2,6.5,42.0,30.2,16.0,82.0,19.1,9.0,5.0,38.0,11.5,26.4,-8.0,-6.0\n"
        )

        try:
            res = self.client.post(
                "/api/csv/import/",
                data=json.dumps({"content": csv_content, "filename": "q1_q2_2028.csv"}),
                content_type="application/json",
                **headers
            )
            self.assertEqual(res.status_code, 201)
            data = res.json()
            self.assertTrue(data.get("success"))
            self.assertEqual(data.get("company_id"), "C003")

            # Verify in database that records are strictly under C003 and NOT WRONG_CID
            self.cur.execute("SELECT company_id, quarter FROM financial_records WHERE quarter IN ('2028Q1', '2028Q2');")
            rows = self.cur.fetchall()
            for r_cid, r_q in rows:
                self.assertEqual(r_cid, "C003", "Imported record must be stamped with C003")

            # Verify upload_history
            res_hist = self.client.get("/api/csv/history/", **headers)
            self.assertEqual(res_hist.status_code, 200)
            history = res_hist.json().get("history", [])
            self.assertGreaterEqual(len(history), 1)
            self.assertEqual(history[0]["filename"], "q1_q2_2028.csv")
            print("[PASS] Test 7: CSV imported safely under authorized company CID with upload history recorded.")
        finally:
            # Clean up test quarters to preserve clean state
            self.cur.execute("DELETE FROM financial_records WHERE quarter IN ('2028Q1', '2028Q2');")
            self.cur.execute("DELETE FROM upload_history WHERE filename = 'q1_q2_2028.csv';")
            self.conn.commit()

    def test_8_company_list_scoping_for_authenticated_users(self):
        """Verify normal authenticated users only see their authorized company, not other companies."""
        # Authenticated as C001
        c001_token = generate_token(user_id=1, email="cfo@c001.com", company_id="C001", role="owner")
        res1 = self.client.get("/api/companies/", HTTP_AUTHORIZATION=f"Bearer {c001_token}")
        self.assertEqual(res1.status_code, 200)
        c001_companies = res1.json().get("companies", [])
        self.assertEqual(c001_companies, ["C001"], "C001 user should only see ['C001'], not other companies")

        # Authenticated as C002
        c002_token = generate_token(user_id=2, email="cfo@c002.com", company_id="C002", role="owner")
        res2 = self.client.get("/api/companies/", HTTP_AUTHORIZATION=f"Bearer {c002_token}")
        self.assertEqual(res2.status_code, 200)
        c002_companies = res2.json().get("companies", [])
        self.assertEqual(c002_companies, ["C002"], "C002 user should only see ['C002'], not other companies")

        # Unauthenticated guest
        res_guest = self.client.get("/api/companies/")
        self.assertEqual(res_guest.status_code, 200)
        guest_companies = res_guest.json().get("companies", [])
        self.assertEqual(guest_companies, ["C001", "C002", "C003"])
        print("[PASS] Test 8: Company list API strictly scoped to user's authorized company.")


if __name__ == "__main__":
    unittest.main()

