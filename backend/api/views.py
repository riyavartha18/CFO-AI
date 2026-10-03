import os
import psycopg2
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

# Import the existing analysis engine without duplicating any logic
from test_prediction import analyze_company


def get_company_record_from_supabase(company_id: str):
    """
    Query Supabase directly using existing connection credentials to get basic company information.
    Works dynamically for any company ID.
    """
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT")
        )
        cur = conn.cursor()
        cur.execute("""
            SELECT 
                company_id,
                COUNT(*) as record_count,
                MIN(quarter) as earliest_quarter,
                MAX(quarter) as latest_quarter
            FROM financial_records
            WHERE company_id = %s
            GROUP BY company_id;
        """, (company_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return None

        return {
            "company_id": row[0],
            "records_count": row[1],
            "earliest_quarter": row[2],
            "latest_quarter": row[3],
            "status": "active"
        }
    except Exception as e:
        print(f"Error querying Supabase for company {company_id}: {e}")
        return None


def get_all_companies_from_supabase():
    """
    Get all distinct company IDs available in Supabase.
    """
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT")
        )
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT company_id FROM financial_records ORDER BY company_id;")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [r[0] for r in rows]
    except Exception as e:
        print(f"Error querying distinct companies from Supabase: {e}")
        return ["C001", "C002"]


@api_view(["GET"])
def companies_list_view(request):
    """
    GET /api/companies/
    Returns list of available company IDs in database.
    """
    companies = get_all_companies_from_supabase()
    return Response({"companies": companies})



@api_view(["GET"])
def health_check(request):
    """
    1. Health check endpoint.
    GET /api/health/
    """
    return Response({"status": "ok"})


@api_view(["GET"])
def company_analysis_view(request, company_id):
    """
    2. Company analysis endpoint.
    GET /api/company/<company_id>/analysis/
    Calls existing analyze_company(company_id) and returns structured analysis.
    """
    result = analyze_company(company_id)
    if not result:
        return Response(
            {"error": "Company not found", "company_id": company_id},
            status=status.HTTP_404_NOT_FOUND
        )
    return Response(result)


@api_view(["GET"])
def company_details_view(request, company_id):
    """
    3. Company existence / details endpoint.
    GET /api/company/<company_id>/
    Returns basic company information from Supabase for any arbitrary company ID.
    """
    details = get_company_record_from_supabase(company_id)
    if not details:
        return Response(
            {"error": "Company not found", "company_id": company_id},
            status=status.HTTP_404_NOT_FOUND
        )
    return Response(details)
