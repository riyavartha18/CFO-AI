"""
Smart CFO - CSV Validation, Ingestion & Template Service
Handles:
- Downloadable 20-column CSV template generation
- Detailed CSV integrity, quarter format, and numeric checks
- Duplicate detection within file and against active Supabase records
- Backend company_id enforcement and secure ingestion
- Upload audit history logging
"""

import io
import re
import os
import pandas as pd
import psycopg2
from .auth import get_db_connection

REQUIRED_COLUMNS = [
    "company_id",
    "quarter",
    "revenue_cr",
    "cogs_cr",
    "operating_expenses_cr",
    "interest_expense_cr",
    "depreciation_cr",
    "tax_cr",
    "cash_cr",
    "accounts_receivable_cr",
    "inventory_cr",
    "fixed_assets_cr",
    "accounts_payable_cr",
    "short_term_debt_cr",
    "other_current_liabilities_cr",
    "long_term_debt_cr",
    "other_non_current_liabilities_cr",
    "operating_cash_flow_cr",
    "investing_cash_flow_cr",
    "financing_cash_flow_cr"
]

NUMERIC_COLUMNS = [
    "revenue_cr",
    "cogs_cr",
    "operating_expenses_cr",
    "interest_expense_cr",
    "depreciation_cr",
    "tax_cr",
    "cash_cr",
    "accounts_receivable_cr",
    "inventory_cr",
    "fixed_assets_cr",
    "accounts_payable_cr",
    "short_term_debt_cr",
    "other_current_liabilities_cr",
    "long_term_debt_cr",
    "other_non_current_liabilities_cr",
    "operating_cash_flow_cr",
    "investing_cash_flow_cr",
    "financing_cash_flow_cr"
]

QUARTER_PATTERN = r"^\d{4}Q[1-4]$"


def generate_csv_template(company_id: str = "CID") -> str:
    """
    Generates standard 20-column CSV template with header only (clean template ready for data entry).
    """
    output = io.StringIO()
    output.write(",".join(REQUIRED_COLUMNS) + "\n")
    return output.getvalue()


def validate_csv_data(file_content: bytes | str, authorized_company_id: str) -> dict:
    """
    Validates CSV against strict criteria:
    1. Schema & required columns
    2. Non-empty data
    3. Numeric conversions
    4. Valid quarter pattern
    5. Duplicate quarters in CSV
    6. Non-negative revenue
    7. Conflicts with existing quarters in Supabase DB for authorized_company_id
    8. Enforces company identity
    """
    errors = []
    warnings = []

    # Read CSV
    try:
        if isinstance(file_content, bytes):
            df = pd.read_csv(io.BytesIO(file_content))
        else:
            df = pd.read_csv(io.StringIO(file_content))
    except Exception as e:
        return {
            "valid": False,
            "errors": [f"Malformed CSV file: {str(e)}"],
            "warnings": [],
            "row_count": 0,
            "quarters": [],
            "preview": []
        }

    if df.empty:
        return {
            "valid": False,
            "errors": ["CSV file contains no data rows."],
            "warnings": [],
            "row_count": 0,
            "quarters": [],
            "preview": []
        }

    # Normalize column names
    df.columns = [c.strip().lower() for c in df.columns]

    # Required columns check
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        errors.append(f"Missing required columns ({len(missing)}): {', '.join(missing)}")

    # Extra columns check
    extras = [col for col in df.columns if col not in REQUIRED_COLUMNS]
    if extras:
        warnings.append(f"Ignored unexpected columns: {', '.join(extras)}")

    if errors:
        return {
            "valid": False,
            "errors": errors,
            "warnings": warnings,
            "row_count": len(df),
            "quarters": [],
            "preview": []
        }

    # Check for empty values in required fields
    null_counts = df[REQUIRED_COLUMNS].isnull().sum()
    null_cols = null_counts[null_counts > 0]
    if len(null_cols) > 0:
        for col, cnt in null_cols.items():
            errors.append(f"Column '{col}' has {cnt} empty or missing values.")

    # Quarter format validation
    invalid_quarters = []
    quarters_list = []
    for idx, q in enumerate(df["quarter"]):
        q_str = str(q).strip().upper()
        quarters_list.append(q_str)
        if not re.match(QUARTER_PATTERN, q_str):
            invalid_quarters.append(f"Row {idx+1}: '{q}' (expected format YYYYQ1-YYYYQ4)")
    
    if invalid_quarters:
        errors.append(f"Invalid quarter format in {len(invalid_quarters)} row(s): {', '.join(invalid_quarters[:5])}")

    # Duplicate quarters in CSV
    duplicates_in_csv = df[df["quarter"].astype(str).str.strip().str.upper().duplicated()]["quarter"].tolist()
    if duplicates_in_csv:
        errors.append(f"Duplicate quarters found within the uploaded file: {', '.join(set(duplicates_in_csv))}")

    # Numeric validation & non-negative revenue
    for col in NUMERIC_COLUMNS:
        converted = pd.to_numeric(df[col], errors="coerce")
        bad_rows = converted.isna().sum()
        if bad_rows > 0:
            errors.append(f"Column '{col}' contains {bad_rows} non-numeric value(s).")
        else:
            df[col] = converted

    if "revenue_cr" in df.columns and pd.api.types.is_numeric_dtype(df["revenue_cr"]):
        neg_rev = df[df["revenue_cr"] < 0]
        if not neg_rev.empty:
            errors.append(f"Revenue cannot be negative (found in quarters: {', '.join(neg_rev['quarter'].astype(str))}).")

    # Company ID validation
    file_cids = df["company_id"].astype(str).str.strip().str.upper().unique().tolist()
    if len(file_cids) > 1:
        errors.append(f"Multiple company IDs found in file: {', '.join(file_cids)}. A file must contain records for only one company.")
    elif file_cids and file_cids[0] != authorized_company_id.upper():
        warnings.append(
            f"Note: Uploaded file contains company ID '{file_cids[0]}'. "
            f"Records will be securely re-assigned to your authenticated company '{authorized_company_id}'."
        )

    # Check for existing quarters in database for this authorized company
    existing_db_quarters = []
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT quarter FROM financial_records WHERE company_id = %s;", (authorized_company_id,))
        existing_db_quarters = [r[0] for r in cur.fetchall()]
        cur.close()
        conn.close()
    except Exception as db_err:
        warnings.append(f"Could not check existing quarters in database: {db_err}")

    overlapping = [q for q in quarters_list if q in existing_db_quarters]
    if overlapping:
        warnings.append(
            f"Overlapping quarters already exist in database for {authorized_company_id}: {', '.join(overlapping)}. "
            f"Importing will update/overwrite these historical quarters."
        )

    preview_rows = df[REQUIRED_COLUMNS].head(5).to_dict(orient="records")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "row_count": len(df),
        "quarters": sorted(list(set(quarters_list))),
        "overlapping_quarters": overlapping,
        "preview": preview_rows
    }


def import_csv_records(file_content: bytes | str, authorized_company_id: str, uploaded_by_user_id: int = None, filename: str = "statement.csv") -> dict:
    """
    Securely ingests validated CSV records into Supabase PostgreSQL.
    Enforces company_id = authorized_company_id on every single row.
    Inserts or updates financial_records and logs to upload_history.
    """
    validation = validate_csv_data(file_content, authorized_company_id)
    if not validation["valid"]:
        raise ValueError(f"CSV Validation Failed: {'; '.join(validation['errors'])}")

    if isinstance(file_content, bytes):
        df = pd.read_csv(io.BytesIO(file_content))
    else:
        df = pd.read_csv(io.StringIO(file_content))

    df.columns = [c.strip().lower() for c in df.columns]
    for col in NUMERIC_COLUMNS:
        df[col] = pd.to_numeric(df[col])
    
    df["quarter"] = df["quarter"].astype(str).str.strip().str.upper()
    # OVERRIDE & SECURE company_id TO AUTHORIZED COMPANY
    df["company_id"] = authorized_company_id.upper()

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        inserted = 0
        updated = 0
        quarters_imported = []

        for _, row in df.iterrows():
            quarter = row["quarter"]
            quarters_imported.append(quarter)

            # Check if quarter exists
            cur.execute("""
                SELECT id FROM financial_records 
                WHERE company_id = %s AND quarter = %s;
            """, (authorized_company_id, quarter))
            existing = cur.fetchone()

            if existing:
                # Update existing record
                rec_id = existing[0]
                update_query = """
                    UPDATE financial_records SET
                        revenue_cr = %s, cogs_cr = %s, operating_expenses_cr = %s,
                        interest_expense_cr = %s, depreciation_cr = %s, tax_cr = %s,
                        cash_cr = %s, accounts_receivable_cr = %s, inventory_cr = %s,
                        fixed_assets_cr = %s, accounts_payable_cr = %s, short_term_debt_cr = %s,
                        other_current_liabilities_cr = %s, long_term_debt_cr = %s,
                        other_non_current_liabilities_cr = %s, operating_cash_flow_cr = %s,
                        investing_cash_flow_cr = %s, financing_cash_flow_cr = %s
                    WHERE id = %s;
                """
                cur.execute(update_query, (
                    row["revenue_cr"], row["cogs_cr"], row["operating_expenses_cr"],
                    row["interest_expense_cr"], row["depreciation_cr"], row["tax_cr"],
                    row["cash_cr"], row["accounts_receivable_cr"], row["inventory_cr"],
                    row["fixed_assets_cr"], row["accounts_payable_cr"], row["short_term_debt_cr"],
                    row["other_current_liabilities_cr"], row["long_term_debt_cr"],
                    row["other_non_current_liabilities_cr"], row["operating_cash_flow_cr"],
                    row["investing_cash_flow_cr"], row["financing_cash_flow_cr"],
                    rec_id
                ))
                updated += 1
            else:
                # Insert new record
                insert_query = """
                    INSERT INTO financial_records (
                        company_id, quarter, revenue_cr, cogs_cr, operating_expenses_cr,
                        interest_expense_cr, depreciation_cr, tax_cr, cash_cr,
                        accounts_receivable_cr, inventory_cr, fixed_assets_cr,
                        accounts_payable_cr, short_term_debt_cr, other_current_liabilities_cr,
                        long_term_debt_cr, other_non_current_liabilities_cr,
                        operating_cash_flow_cr, investing_cash_flow_cr, financing_cash_flow_cr
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    );
                """
                cur.execute(insert_query, (
                    authorized_company_id, quarter,
                    row["revenue_cr"], row["cogs_cr"], row["operating_expenses_cr"],
                    row["interest_expense_cr"], row["depreciation_cr"], row["tax_cr"],
                    row["cash_cr"], row["accounts_receivable_cr"], row["inventory_cr"],
                    row["fixed_assets_cr"], row["accounts_payable_cr"], row["short_term_debt_cr"],
                    row["other_current_liabilities_cr"], row["long_term_debt_cr"],
                    row["other_non_current_liabilities_cr"], row["operating_cash_flow_cr"],
                    row["investing_cash_flow_cr"], row["financing_cash_flow_cr"]
                ))
                inserted += 1

        # Record in upload_history
        cur.execute("""
            INSERT INTO upload_history (
                company_id, filename, uploaded_by, records_count, quarters_uploaded, status
            ) VALUES (%s, %s, %s, %s, %s, %s);
        """, (
            authorized_company_id,
            filename,
            uploaded_by_user_id,
            len(df),
            ", ".join(sorted(quarters_imported)),
            "success"
        ))

        conn.commit()
        cur.close()
        conn.close()

        return {
            "success": True,
            "company_id": authorized_company_id,
            "total_records": len(df),
            "inserted": inserted,
            "updated": updated,
            "quarters": sorted(quarters_imported)
        }
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        raise e


def get_company_upload_history(company_id: str) -> list[dict]:
    """Retrieves upload audit history for the company."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            uh.id, uh.filename, uh.records_count, uh.quarters_uploaded, 
            uh.status, uh.created_at, u.email as uploader_email, u.full_name as uploader_name
        FROM upload_history uh
        LEFT JOIN app_users u ON u.id = uh.uploaded_by
        WHERE uh.company_id = %s
        ORDER BY uh.created_at DESC
        LIMIT 20;
    """, (company_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    history = []
    for r in rows:
        history.append({
            "id": r[0],
            "filename": r[1],
            "records_count": r[2],
            "quarters_uploaded": r[3],
            "status": r[4],
            "created_at": r[5].strftime("%Y-%m-%d %H:%M:%S") if r[5] else None,
            "uploader_email": r[6],
            "uploader_name": r[7]
        })
    return history
