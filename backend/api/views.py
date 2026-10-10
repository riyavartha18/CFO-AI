import os
import psycopg2
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

# Import the existing analysis engine without duplicating any logic
from test_prediction import analyze_company
from .forecasting import generate_company_revenue_forecast
from anomaly import (
    analyze_anomalies_for_company,
    get_single_record_anomaly_details,
    toggle_record_review
)


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


@api_view(["GET"])
def company_forecast_view(request, company_id):
    """
    4. Company revenue forecasting endpoint.
    GET /api/forecast/<company_id>/
    GET /api/company/<company_id>/forecast/
    Generates 4-quarter revenue forecast using deterministic Seasonal + Trend Baseline method.
    """
    try:
        forecast_result = generate_company_revenue_forecast(company_id)
        return Response(forecast_result, status=status.HTTP_200_OK)
    except LookupError as e:
        return Response(
            {
                "status": "error",
                "error": "Company not found",
                "detail": str(e),
                "company_id": company_id
            },
            status=status.HTTP_404_NOT_FOUND
        )
    except ValueError as e:
        error_info = e.args[0] if isinstance(e.args[0], dict) else {"message": str(e), "error_type": "VALIDATION_ERROR"}
        return Response(
            {
                "status": "error",
                "error": "Insufficient or invalid financial data for forecasting",
                "detail": error_info.get("message", str(e)),
                "error_type": error_info.get("error_type", "VALIDATION_ERROR"),
                "company_id": company_id
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )
    except Exception as e:
        return Response(
            {
                "status": "error",
                "error": "Internal forecasting error",
                "detail": str(e),
                "company_id": company_id
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================
# ANOMALY DETECTION API ENDPOINTS
# ============================================================

@api_view(["GET"])
def anomaly_overview_view(request):
    """
    GET /api/anomaly-detection/overview/?company_id=C001
    GET /api/anomaly-detection/records/?company_id=C001
    Returns Isolation Forest anomaly analysis, charts data, and summary metrics.
    """
    company_id = request.query_params.get("company_id", "C001").strip().upper()
    try:
        data = analyze_anomalies_for_company(company_id)
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"error": "Failed to analyze financial anomalies", "detail": str(e), "company_id": company_id},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
def anomaly_scan_view(request):
    """
    POST /api/anomaly-detection/scan/
    Payload: {"company_id": "C001"}
    Triggers Isolation Forest re-scan and updates scan timestamp.
    """
    company_id = request.data.get("company_id", "C001").strip().upper()
    try:
        data = analyze_anomalies_for_company(company_id, re_scan=True)
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"error": "Failed to run anomaly detection scan", "detail": str(e), "company_id": company_id},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
def anomaly_detail_view(request, record_id):
    """
    GET /api/anomaly-detection/detail/<record_id>/?feature_key=operating_expenses
    Returns parameter-focused explanation, historical values, and trend line for a specific record & parameter.
    """
    feature_key = request.query_params.get("feature_key")
    try:
        details = get_single_record_anomaly_details(record_id, feature_key=feature_key)
        if not details:
            return Response(
                {"error": f"Record with ID {record_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(details, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"error": "Failed to fetch parameter anomaly details", "detail": str(e), "record_id": record_id},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
def anomaly_review_view(request, record_id):
    """
    POST /api/anomaly-detection/review/<record_id>/
    Payload: {"reviewed": true/false}
    Toggles review state of an anomaly record.
    """
    reviewed = request.data.get("reviewed", True)
    try:
        toggle_record_review(record_id, reviewed)
        return Response({"success": True, "record_id": record_id, "reviewed": reviewed})
    except Exception as e:
        return Response(
            {"error": "Failed to update review status", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


