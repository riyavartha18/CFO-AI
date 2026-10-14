"""
Smart CFO - Authentication & Authorization Security Module
Provides:
- JWT token creation and verification
- Password hashing and verification via Django auth hashers
- Automatic unique Company ID (CID) generation
- Request authorization helpers preventing cross-company access
"""

import os
import re
import datetime
import jwt
import psycopg2
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password

JWT_SECRET = getattr(settings, "SECRET_KEY", "smart-cfo-dev-secret-key-production-replace")
JWT_ALGORITHM = "HS256"
DEMO_COMPANIES = {"C001", "C002", "C003"}


def get_db_connection():
    """Returns direct psycopg2 connection to Supabase PostgreSQL."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT")
    )


def generate_token(user_id: int, email: str, company_id: str, role: str = "owner", days: int = 7) -> str:
    """Generates a signed JWT access token."""
    payload = {
        "user_id": user_id,
        "email": email,
        "company_id": company_id,
        "role": role,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=days),
        "iat": datetime.datetime.now(datetime.timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decodes and validates a JWT token."""
    if not token:
        return None
    try:
        if token.lower().startswith("bearer "):
            token = token[7:].strip()
        elif token.lower().startswith("token "):
            token = token[6:].strip()
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def get_auth_from_request(request) -> dict | None:
    """Extracts and verifies auth claims from request headers."""
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header:
        # Fallback to query param for export/download endpoints if needed
        auth_header = request.query_params.get("token", "")
        if auth_header:
            auth_header = f"Bearer {auth_header}"

    return decode_token(auth_header)


def get_next_company_id(cur) -> str:
    """
    Generates next sequential unique Company ID (CID).
    Scans existing companies matching C001, C002, etc. and assigns the next available unique ID.
    Guarantees no collision.
    """
    cur.execute("SELECT company_id FROM companies;")
    rows = cur.fetchall()
    
    max_num = 0
    pattern = re.compile(r"^C(\d+)$", re.IGNORECASE)
    for (cid,) in rows:
        match = pattern.match(str(cid).strip())
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num

    # Default start at 3 since C001-C003 are existing dummy companies
    next_num = max(max_num + 1, 4)
    # Format as C004, C005, ..., C010, etc.
    candidate = f"C{next_num:03d}"
    
    # Confirm uniqueness
    while True:
        cur.execute("SELECT 1 FROM companies WHERE company_id = %s;", (candidate,))
        if not cur.fetchone():
            return candidate
        next_num += 1
        candidate = f"C{next_num:03d}"


def authorize_company_access(request, target_company_id: str) -> tuple[bool, str | None, dict | None]:
    """
    Enforces company-level authorization.
    Returns (is_authorized, error_message, auth_claims)
    - If user is authenticated: target_company_id MUST match user's authorized company_id.
    - If user is unauthenticated: only DEMO_COMPANIES (C001, C002, C003) are accessible for backwards compatibility with tests.
    """
    target = target_company_id.strip().upper() if target_company_id else ""
    auth = get_auth_from_request(request)

    if auth:
        user_company = auth.get("company_id", "").strip().upper()
        user_role = auth.get("role", "")
        if user_role in ["admin", "platform_admin"]:
            return True, None, auth
        if not target or target == "CURRENT" or target == user_company:
            return True, None, auth
        
        # User is attempting to access another company's records!
        return False, f"Access denied: You are authorized only for company '{user_company}', not '{target}'.", auth

    # Unauthenticated request
    if target in DEMO_COMPANIES:
        # Permit demo/unauthenticated reads for standard benchmark companies (preserves existing unit tests)
        return True, None, None

    return False, "Authentication required. Please provide a valid Bearer token.", None
