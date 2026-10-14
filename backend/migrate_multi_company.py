"""
Migration script for Smart CFO Multi-Company platform:
- Creates app_users table
- Creates company_users table (supports multiple users per company)
- Creates upload_history table
- Preserves all existing companies & financial records
- Ensures C003 is present in companies table
- Seeds demo users for C001, C002, and C003
"""

import os
import sys
import psycopg2
from pathlib import Path
from dotenv import load_dotenv
from django.contrib.auth.hashers import make_password

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cfo_backend.settings")
import django
django.setup()

from dotenv import load_dotenv
from django.contrib.auth.hashers import make_password

def run_migration():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT")
    )
    cur = conn.cursor()

    print("1. Creating app_users table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS app_users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """)

    print("2. Creating company_users table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS company_users (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
            company_id VARCHAR(64) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
            role VARCHAR(32) DEFAULT 'owner',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT uq_user_company UNIQUE (user_id, company_id)
        );
    """)

    print("3. Creating upload_history table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS upload_history (
            id SERIAL PRIMARY KEY,
            company_id VARCHAR(64) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
            filename VARCHAR(255) NOT NULL,
            uploaded_by INT REFERENCES app_users(id) ON DELETE SET NULL,
            records_count INT DEFAULT 0,
            quarters_uploaded TEXT,
            status VARCHAR(32) DEFAULT 'success',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """)

    print("4. Ensuring dummy company C003 exists in companies table...")
    cur.execute("""
        INSERT INTO companies (company_id, company_name, industry, company_size)
        VALUES ('C003', 'Apex Industries', 'Manufacturing', 'Enterprise')
        ON CONFLICT (company_id) DO NOTHING;
    """)

    print("5. Seeding demo user accounts for C001, C002, and C003...")
    demo_users = [
        ("cfo@c001.com", "Password123!", "Acme CFO", "C001", "owner"),
        ("cfo@c002.com", "Password123!", "NovaTech Controller", "C002", "owner"),
        ("cfo@c003.com", "Password123!", "Apex Director", "C003", "owner"),
        # Additional team member for C001 to demonstrate multiple users per company
        ("analyst@c001.com", "Password123!", "Acme Senior Analyst", "C001", "analyst"),
    ]

    for email, pwd, name, comp_id, role in demo_users:
        hashed = make_password(pwd)
        cur.execute("""
            INSERT INTO app_users (email, password_hash, full_name)
            VALUES (%s, %s, %s)
            ON CONFLICT (email) DO UPDATE
            SET password_hash = EXCLUDED.password_hash,
                full_name = EXCLUDED.full_name
            RETURNING id;
        """, (email, hashed, name))
        user_id = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO company_users (user_id, company_id, role)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, company_id) DO UPDATE
            SET role = EXCLUDED.role;
        """, (user_id, comp_id, role))

    conn.commit()
    print("Database migration and demo user seeding completed successfully!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    run_migration()
