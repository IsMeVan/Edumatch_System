"""
Create the user_reports table for bug reports and feedback.
"""
import psycopg2
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute("""
    CREATE TABLE IF NOT EXISTS user_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        subject VARCHAR(200),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'new',
        admin_reply TEXT,
        page_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
    )
""")
conn.commit()
print("[OK] Created user_reports table")

cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_user_reports_status 
    ON user_reports(status)
""")
cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_user_reports_user 
    ON user_reports(user_id)
""")
conn.commit()
print("[OK] Created indexes")

cur.close()
conn.close()
print("[DONE]")
