import os
import psycopg2
from django.http import HttpResponse
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

# Import the existing analysis engine without duplicating any logic
from test_prediction import analyze_company
from .forecasting import generate_company_revenue_forecast, generate_company_cash_flow_forecast
from anomaly import (
    analyze_anomalies_for_company,
    get_single_record_anomaly_details,
    toggle_record_review
)

# Multi-Company Auth & CSV services
from .auth import (
    get_db_connection,
    get_next_company_id,
    generate_token,
    get_auth_from_request,
    authorize_company_access
)
from .csv_service import (
    generate_csv_template,
    validate_csv_data,
    import_csv_records,
    get_company_upload_history
)


def get_company_record_from_supabase(company_id: str):
    """
    Query Supabase directly using existing connection credentials to get basic company information.
    Works dynamically for any company ID.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Query company details
        cur.execute("""
            SELECT company_id, company_name, industry, company_size
            FROM companies
            WHERE company_id = %s;
        """, (company_id,))
        comp = cur.fetchone()

        cur.execute("""
            SELECT 
                COUNT(*) as record_count,
                MIN(quarter) as earliest_quarter,
                MAX(quarter) as latest_quarter
            FROM financial_records
            WHERE company_id = %s;
        """, (company_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not comp and (not row or row[0] == 0):
            return None

        return {
            "company_id": comp[0] if comp else company_id,
            "company_name": comp[1] if comp else f"Company {company_id}",
            "industry": comp[2] if comp else "General",
            "company_size": comp[3] if comp else "Medium",
            "records_count": row[0] if row else 0,
            "earliest_quarter": row[1] if row and row[1] else None,
            "latest_quarter": row[2] if row and row[2] else None,
            "status": "active"
        }
    except Exception as e:
        print(f"Error querying Supabase for company {company_id}: {e}")
        return None


def get_all_companies_from_supabase():
    """
    Get all distinct company IDs with financial records available in Supabase.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT company_id FROM financial_records ORDER BY company_id;")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [r[0] for r in rows]
    except Exception as e:
        print(f"Error querying distinct companies from Supabase: {e}")
        return ["C001", "C002", "C003"]


@api_view(["GET"])
def health_check(request):
    """
    1. Health check endpoint.
    GET /api/health/
    """
    return Response({"status": "ok"})


# ============================================================
# MULTI-COMPANY AUTHENTICATION & REGISTRATION ENDPOINTS
# ============================================================

@api_view(["POST"])
def auth_register_view(request):
    """
    POST /api/auth/register/
    Registers a new company, automatically assigning a unique CID (e.g. C004).
    Creates master company user in app_users, links in company_users, and returns JWT.
    """
    data = request.data or {}
    company_name = data.get("companyName") or data.get("company_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    industry = data.get("industry", "Technology").strip()
    company_size = data.get("companySize") or data.get("company_size", "51-200 employees").strip()
    full_name = data.get("fullName") or data.get("full_name") or f"{company_name} Administrator"

    if not company_name or not email or not password:
        return Response(
            {"error": "Company name, work email, and password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 6:
        return Response(
            {"error": "Password must be at least 6 characters."},
            status=status.HTTP_400_BAD_REQUEST
        )

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Check if email is already taken
        cur.execute("SELECT id FROM app_users WHERE email = %s;", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return Response(
                {"error": f"An account with email '{email}' already exists."},
                status=status.HTTP_409_CONFLICT
            )

        # Automatically assign unique CID
        company_id = get_next_company_id(cur)

        # Insert company
        cur.execute("""
            INSERT INTO companies (company_id, company_name, industry, company_size)
            VALUES (%s, %s, %s, %s);
        """, (company_id, company_name, industry, company_size))

        # Insert user
        password_hash = make_password(password)
        cur.execute("""
            INSERT INTO app_users (email, password_hash, full_name)
            VALUES (%s, %s, %s)
            RETURNING id, created_at;
        """, (email, password_hash, full_name))
        user_row = cur.fetchone()
        user_id = user_row[0]

        # Link user to company
        cur.execute("""
            INSERT INTO company_users (user_id, company_id, role)
            VALUES (%s, %s, 'owner');
        """, (user_id, company_id))

        conn.commit()
        cur.close()
        conn.close()

        # Generate JWT
        token = generate_token(user_id=user_id, email=email, company_id=company_id, role="owner")

        return Response({
            "success": True,
            "message": "Company registered successfully with auto-assigned CID.",
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": "owner"
            },
            "company": {
                "company_id": company_id,
                "company_name": company_name,
                "industry": industry,
                "company_size": company_size
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return Response(
            {"error": "Failed to complete registration.", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
def auth_login_view(request):
    """
    POST /api/auth/login/
    Authenticates user, verifies password, and resolves company membership.
    """
    data = request.data or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return Response(
            {"error": "Please provide both email and password."},
            status=status.HTTP_400_BAD_REQUEST
        )

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT id, email, password_hash, full_name
            FROM app_users
            WHERE email = %s;
        """, (email,))
        user = cur.fetchone()

        if not user or not check_password(password, user[2]):
            cur.close()
            conn.close()
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user_id = user[0]
        full_name = user[3]

        # Retrieve company memberships
        cur.execute("""
            SELECT cu.company_id, cu.role, c.company_name, c.industry, c.company_size
            FROM company_users cu
            JOIN companies c ON c.company_id = cu.company_id
            WHERE cu.user_id = %s
            ORDER BY cu.id ASC;
        """, (user_id,))
        memberships = cur.fetchall()
        cur.close()
        conn.close()

        if not memberships:
            return Response(
                {"error": "User is not associated with any active company."},
                status=status.HTTP_403_FORBIDDEN
            )

        primary_company = memberships[0]
        company_id = primary_company[0]
        role = primary_company[1]

        token = generate_token(user_id=user_id, email=email, company_id=company_id, role=role)

        companies_list = [{
            "company_id": m[0],
            "role": m[1],
            "company_name": m[2],
            "industry": m[3],
            "company_size": m[4]
        } for m in memberships]

        return Response({
            "success": True,
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": role
            },
            "company": {
                "company_id": primary_company[0],
                "company_name": primary_company[2],
                "industry": primary_company[3],
                "company_size": primary_company[4],
                "role": primary_company[1]
            },
            "available_companies": companies_list
        }, status=status.HTTP_200_OK)

    except Exception as e:
        cur.close()
        conn.close()
        return Response(
            {"error": "Authentication processing error.", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
def auth_me_view(request):
    """
    GET /api/auth/me/
    Returns current authenticated user identity and company profile.
    """
    auth = get_auth_from_request(request)
    if not auth:
        return Response(
            {"error": "Unauthorized: Bearer token is missing or invalid."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    company_id = auth.get("company_id")
    details = get_company_record_from_supabase(company_id)

    return Response({
        "authenticated": True,
        "user": {
            "id": auth.get("user_id"),
            "email": auth.get("email"),
            "role": auth.get("role")
        },
        "company": details or {"company_id": company_id}
    })


@api_view(["GET"])
def companies_list_view(request):
    """
    GET /api/companies/
    Returns strictly authorized company IDs for the authenticated user, or public demo companies for guest mode.
    Never exposes other companies to normal users.
    """
    auth = get_auth_from_request(request)
    if auth:
        user_id = auth.get("user_id")
        role = auth.get("role", "")
        if role in ["admin", "platform_admin"]:
            all_cids = get_all_companies_from_supabase()
            return Response({"companies": all_cids})

        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("""
                SELECT DISTINCT company_id 
                FROM company_users 
                WHERE user_id = %s 
                ORDER BY company_id;
            """, (user_id,))
            rows = cur.fetchall()
            cur.close()
            conn.close()
            user_cids = [r[0] for r in rows] if rows else [auth.get("company_id")]
            return Response({"companies": user_cids})
        except Exception:
            return Response({"companies": [auth.get("company_id")]})

    # Fallback to public demo companies for unauthenticated guest mode
    return Response({"companies": ["C001", "C002", "C003"]})


# ============================================================
# CSV TEMPLATE, VALIDATION, AND INGESTION ENDPOINTS
# ============================================================

@api_view(["GET"])
def csv_template_view(request):
    """
    GET /api/csv/template/
    Provides downloadable 20-column CSV template with header row and sample records.
    """
    auth = get_auth_from_request(request)
    company_id = auth.get("company_id") if auth else "C001"
    template_content = generate_csv_template(company_id=company_id)

    response = HttpResponse(template_content, content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="smart_cfo_financial_template.csv"'
    return response


@api_view(["POST"])
def csv_validate_view(request):
    """
    POST /api/csv/validate/
    Pre-validates uploaded CSV file or body against 20-column schema,
    quarter formats, duplicate detection, and checks against active Supabase quarters.
    """
    auth = get_auth_from_request(request)
    authorized_cid = auth.get("company_id") if auth else request.data.get("company_id", "C001")

    # Read file from multipart or body
    file_obj = request.FILES.get("file")
    if file_obj:
        content = file_obj.read()
    else:
        content = request.data.get("content", "")
        if not content:
            return Response(
                {"error": "No CSV file or data content provided for validation."},
                status=status.HTTP_400_BAD_REQUEST
            )

    result = validate_csv_data(content, authorized_cid)
    return Response(result, status=status.HTTP_200_OK)


@api_view(["POST"])
def csv_import_view(request):
    """
    POST /api/csv/import/
    Securely ingests validated CSV records into Supabase PostgreSQL.
    Enforces that all records are bound to the authenticated user's company CID.
    Rejects unauthorized access and cross-company overwrites.
    """
    auth = get_auth_from_request(request)
    if not auth:
        return Response(
            {"error": "Authentication required to ingest financial statements."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    authorized_cid = auth.get("company_id")
    user_id = auth.get("user_id")

    file_obj = request.FILES.get("file")
    filename = file_obj.name if file_obj else "statement.csv"

    if file_obj:
        content = file_obj.read()
    else:
        content = request.data.get("content", "")
        filename = request.data.get("filename", "statement.csv")
        if not content:
            return Response(
                {"error": "No CSV file or data provided for import."},
                status=status.HTTP_400_BAD_REQUEST
            )

    try:
        import_result = import_csv_records(
            file_content=content,
            authorized_company_id=authorized_cid,
            uploaded_by_user_id=user_id,
            filename=filename
        )
        return Response(import_result, status=status.HTTP_201_CREATED)
    except ValueError as ve:
        return Response(
            {"error": "CSV Ingestion Rejected", "detail": str(ve)},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )
    except Exception as e:
        return Response(
            {"error": "Database ingestion failed", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
def csv_history_view(request):
    """
    GET /api/csv/history/
    Retrieves previous statement upload history for the authenticated company.
    """
    auth = get_auth_from_request(request)
    if not auth:
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    company_id = auth.get("company_id")
    history = get_company_upload_history(company_id)
    return Response({"company_id": company_id, "history": history})


# ============================================================
# COMPANY FINANCIAL ANALYSIS, DETAILS, AND FORECASTING
# ============================================================

@api_view(["GET"])
def company_analysis_view(request, company_id):
    """
    GET /api/company/<company_id>/analysis/
    Calls existing analyze_company(company_id) with strict multi-company authorization.
    """
    is_allowed, err_msg, auth = authorize_company_access(request, company_id)
    if not is_allowed:
        return Response({"error": err_msg, "company_id": company_id}, status=status.HTTP_403_FORBIDDEN)

    effective_cid = auth.get("company_id") if (auth and company_id.upper() == "CURRENT") else company_id

    result = analyze_company(effective_cid)
    if not result:
        return Response(
            {"error": "Company not found", "company_id": effective_cid},
            status=status.HTTP_404_NOT_FOUND
        )
    return Response(result)


@api_view(["GET"])
def company_details_view(request, company_id):
    """
    GET /api/company/<company_id>/
    Returns company details from Supabase with authorization verification.
    """
    is_allowed, err_msg, auth = authorize_company_access(request, company_id)
    if not is_allowed:
        return Response({"error": err_msg, "company_id": company_id}, status=status.HTTP_403_FORBIDDEN)

    effective_cid = auth.get("company_id") if (auth and company_id.upper() == "CURRENT") else company_id

    details = get_company_record_from_supabase(effective_cid)
    if not details:
        return Response(
            {"error": "Company not found", "company_id": effective_cid},
            status=status.HTTP_404_NOT_FOUND
        )
    return Response(details)


@api_view(["GET"])
def company_forecast_view(request, company_id):
    """
    GET /api/forecast/<company_id>/
    GET /api/company/<company_id>/forecast/
    Generates 4-quarter revenue forecast with authorization enforcement.
    """
    is_allowed, err_msg, auth = authorize_company_access(request, company_id)
    if not is_allowed:
        return Response({"error": err_msg, "company_id": company_id}, status=status.HTTP_403_FORBIDDEN)

    effective_cid = auth.get("company_id") if (auth and company_id.upper() == "CURRENT") else company_id

    try:
        forecast_result = generate_company_revenue_forecast(effective_cid)
        return Response(forecast_result, status=status.HTTP_200_OK)
    except LookupError as e:
        return Response(
            {
                "status": "error",
                "error": "Company not found",
                "detail": str(e),
                "company_id": effective_cid
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
                "company_id": effective_cid
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )
    except Exception as e:
        return Response(
            {
                "status": "error",
                "error": "Internal forecasting error",
                "detail": str(e),
                "company_id": effective_cid
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
def company_cash_flow_forecast_view(request, company_id):
    """
    GET /api/forecast/cash-flow/<company_id>/
    GET /api/company/<company_id>/forecast/cash-flow/
    Generates 4-quarter cash flow forecast with authorization enforcement.
    """
    is_allowed, err_msg, auth = authorize_company_access(request, company_id)
    if not is_allowed:
        return Response({"error": err_msg, "company_id": company_id}, status=status.HTTP_403_FORBIDDEN)

    effective_cid = auth.get("company_id") if (auth and company_id.upper() == "CURRENT") else company_id

    try:
        forecast_result = generate_company_cash_flow_forecast(effective_cid)
        return Response(forecast_result, status=status.HTTP_200_OK)
    except LookupError as e:
        return Response(
            {
                "status": "error",
                "error": "Company not found",
                "detail": str(e),
                "company_id": effective_cid
            },
            status=status.HTTP_404_NOT_FOUND
        )
    except ValueError as e:
        error_info = e.args[0] if isinstance(e.args[0], dict) else {"message": str(e), "error_type": "VALIDATION_ERROR"}
        return Response(
            {
                "status": "error",
                "error": "Insufficient or invalid operating cash flow data for forecasting",
                "detail": error_info.get("message", str(e)),
                "error_type": error_info.get("error_type", "VALIDATION_ERROR"),
                "company_id": effective_cid
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )
    except Exception as e:
        return Response(
            {
                "status": "error",
                "error": "Internal cash flow forecasting error",
                "detail": str(e),
                "company_id": effective_cid
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================
# ANOMALY DETECTION API ENDPOINTS (WITH SCOPING)
# ============================================================

@api_view(["GET"])
def anomaly_overview_view(request):
    """
    GET /api/anomaly-detection/overview/?company_id=C001
    GET /api/anomaly-detection/records/?company_id=C001
    Scaped to the authorized company.
    """
    auth = get_auth_from_request(request)
    company_id = request.query_params.get("company_id")
    if not company_id and auth:
        company_id = auth.get("company_id")
    company_id = (company_id or "C001").strip().upper()

    is_allowed, err_msg, _ = authorize_company_access(request, company_id)
    if not is_allowed:
        return Response({"error": err_msg, "company_id": company_id}, status=status.HTTP_403_FORBIDDEN)

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
    """
    auth = get_auth_from_request(request)
    company_id = request.data.get("company_id")
    if not company_id and auth:
        company_id = auth.get("company_id")
    company_id = (company_id or "C001").strip().upper()

    is_allowed, err_msg, _ = authorize_company_access(request, company_id)
    if not is_allowed:
        return Response({"error": err_msg, "company_id": company_id}, status=status.HTTP_403_FORBIDDEN)

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
    """
    feature_key = request.query_params.get("feature_key")
    try:
        details = get_single_record_anomaly_details(record_id, feature_key=feature_key)
        if not details:
            return Response(
                {"error": f"Record with ID {record_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Scoping verification
        rec_cid = details.get("company_info", {}).get("company_id")
        if rec_cid:
            is_allowed, err_msg, _ = authorize_company_access(request, rec_cid)
            if not is_allowed:
                return Response({"error": err_msg, "record_id": record_id}, status=status.HTTP_403_FORBIDDEN)

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
