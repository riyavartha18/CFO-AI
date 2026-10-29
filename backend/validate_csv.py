# ============================================================
# SMART CFO - CSV VALIDATION
# ============================================================
#
# Purpose:
# Validate company financial CSV before inserting into Supabase.
#
# Checks:
# 1. Required columns
# 2. Extra columns
# 3. Empty values
# 4. Company ID consistency
# 5. Duplicate quarters
# 6. Quarter format
# 7. Numeric values
# 8. Negative revenue
#
# ============================================================

import pandas as pd
import re


# ============================================================
# 1. REQUIRED CSV COLUMNS
# ============================================================

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


# ============================================================
# 2. NUMERIC COLUMNS
# ============================================================

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


# ============================================================
# 3. QUARTER FORMAT
# ============================================================
#
# Valid:
# 2023Q1
# 2023Q2
# 2023Q3
# 2023Q4
#
# Invalid:
# Q1 2023
# 2023-Q1
# January 2023
#
# ============================================================

QUARTER_PATTERN = r"^\d{4}Q[1-4]$"


# ============================================================
# 4. MAIN VALIDATION FUNCTION
# ============================================================

def validate_csv(file_path):

    print("\n" + "=" * 70)
    print("          SMART CFO - CSV VALIDATION")
    print("=" * 70)

    print(f"\nFile: {file_path}")


    # ========================================================
    # STEP 1 - READ CSV
    # ========================================================

    try:

        df = pd.read_csv(file_path)

    except Exception as e:

        print("\n❌ Could not read CSV file.")

        print("Error:", e)

        return None


    print(
        f"\nRows found: {len(df)}"
    )

    print(
        f"Columns found: {len(df.columns)}"
    )


    # ========================================================
    # STEP 2 - CHECK EMPTY FILE
    # ========================================================

    if df.empty:

        print("\n❌ CSV file is empty.")

        return None


    # ========================================================
    # STEP 3 - CHECK REQUIRED COLUMNS
    # ========================================================

    missing_columns = [

        column

        for column in REQUIRED_COLUMNS

        if column not in df.columns
    ]


    if missing_columns:

        print(
            "\n❌ Missing required columns:"
        )

        for column in missing_columns:

            print(
                "   -",
                column
            )

        return None


    print(
        "\n✅ All required columns are present."
    )


    # ========================================================
    # STEP 4 - CHECK EXTRA COLUMNS
    # ========================================================

    extra_columns = [

        column

        for column in df.columns

        if column not in REQUIRED_COLUMNS
    ]


    if extra_columns:

        print(
            "\n❌ Unexpected extra columns found:"
        )

        for column in extra_columns:

            print(
                "   -",
                column
            )

        return None


    print(
        "✅ No unexpected columns found."
    )


    # ========================================================
    # STEP 5 - CHECK EMPTY VALUES
    # ========================================================

    missing_values = (

        df[REQUIRED_COLUMNS]
        .isnull()
        .sum()
    )


    missing_values = (

        missing_values[
            missing_values > 0
        ]
    )


    if len(missing_values) > 0:

        print(
            "\n❌ Missing values found:"
        )


        for column, count in missing_values.items():

            print(
                f"   - {column}: "
                f"{count} missing"
            )

        return None


    print(
        "✅ No missing values found."
    )


    # ========================================================
    # STEP 6 - CHECK COMPANY ID
    # ========================================================

    company_ids = (

        df["company_id"]
        .astype(str)
        .str.strip()
    )


    # Empty company IDs

    if (company_ids == "").any():

        print(
            "\n❌ Empty company ID found."
        )

        return None


    unique_company_ids = (

        company_ids
        .unique()
    )


    # One CSV should belong to one company

    if len(unique_company_ids) != 1:

        print(
            "\n❌ Multiple company IDs found."
        )

        print(
            "Company IDs found:"
        )

        for company_id in unique_company_ids:

            print(
                "   -",
                company_id
            )

        print(
            "\nOne CSV must contain data "
            "for only one company."
        )

        return None


    company_id = unique_company_ids[0]


    print(
        f"✅ Company ID: {company_id}"
    )


    # ========================================================
    # STEP 7 - CHECK QUARTER FORMAT
    # ========================================================

    invalid_quarters = []

    for quarter in df["quarter"]:

        quarter = str(quarter).strip()

        if not re.match(
            QUARTER_PATTERN,
            quarter
        ):

            invalid_quarters.append(
                quarter
            )


    if invalid_quarters:

        print(
            "\n❌ Invalid quarter format:"
        )

        for quarter in invalid_quarters:

            print(
                "   -",
                quarter
            )

        print(
            "\nExpected format: YYYYQ1, YYYYQ2, "
            "YYYYQ3 or YYYYQ4"
        )

        return None


    print(
        "✅ Quarter format is valid."
    )


    # ========================================================
    # STEP 8 - CHECK DUPLICATE QUARTERS
    # ========================================================

    duplicate_quarters = (

        df["quarter"]
        .duplicated()
    )


    if duplicate_quarters.any():

        duplicates = (

            df.loc[
                duplicate_quarters,
                "quarter"
            ]
            .tolist()
        )


        print(
            "\n❌ Duplicate quarters found:"
        )


        for quarter in duplicates:

            print(
                "   -",
                quarter
            )


        return None


    print(
        "✅ No duplicate quarters found."
    )


    # ========================================================
    # STEP 9 - CHECK NUMERIC COLUMNS
    # ========================================================

    invalid_numeric_columns = []


    for column in NUMERIC_COLUMNS:

        converted = pd.to_numeric(
            df[column],
            errors="coerce"
        )


        invalid_rows = (

            converted.isna()
        )


        if invalid_rows.any():

            invalid_numeric_columns.append(
                column
            )


    if invalid_numeric_columns:

        print(
            "\n❌ Non-numeric values found in:"
        )


        for column in invalid_numeric_columns:

            print(
                "   -",
                column
            )


        print(
            "\nAll financial values must be numeric."
        )

        return None


    print(
        "✅ All financial values are numeric."
    )


    # ========================================================
    # STEP 10 - CONVERT NUMERIC COLUMNS
    # ========================================================

    for column in NUMERIC_COLUMNS:

        df[column] = pd.to_numeric(
            df[column]
        )


    # ========================================================
    # STEP 11 - CHECK NEGATIVE REVENUE
    # ========================================================

    negative_revenue = (

        df["revenue_cr"] < 0
    )


    if negative_revenue.any():

        print(
            "\n❌ Negative revenue found."
        )

        print(
            df.loc[
                negative_revenue,
                ["quarter", "revenue_cr"]
            ]
            .to_string(index=False)
        )

        return None


    print(
        "✅ Revenue values are valid."
    )


    # ========================================================
    # STEP 12 - FINAL VALIDATION
    # ========================================================

    print("\n" + "=" * 70)

    print(
        "             CSV VALIDATION PASSED"
    )

    print("=" * 70)


    print(
        f"\nCompany ID: {company_id}"
    )

    print(
        f"Number of records: {len(df)}"
    )

    print(
        f"Quarters: "
        f"{df['quarter'].min()} → "
        f"{df['quarter'].max()}"
    )


    print(
        "\n✅ CSV is valid and ready for Supabase."
    )


    return df


# ============================================================
# 5. RUN FROM TERMINAL
# ============================================================

if __name__ == "__main__":

    print("\n" + "=" * 70)

    print(
        "          SMART CFO CSV VALIDATOR"
    )

    print("=" * 70)


    file_path = input(
        "\nEnter CSV file path: "
    ).strip()


    if not file_path:

        print(
            "\n❌ File path cannot be empty."
        )

    else:

        validated_df = validate_csv(
            file_path
        )


        if validated_df is not None:

            print(
                "\n🎉 Validation successful!"
            )

            print(
                "\nReady for next step:"
            )

            print(
                "CSV → Supabase"
            )

        else:

            print(
                "\n❌ CSV validation failed."
            )
            