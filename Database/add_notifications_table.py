"""
Create notifications table for admin-to-user messages.
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
    CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        from_admin_id INTEGER REFERENCES users(id),
        title VARCHAR(200),
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        related_report_id INTEGER REFERENCES user_reports(id) ON DELETE SET NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        read_at TIMESTAMP
    )
""")
conn.commit()
print("[OK] Created notifications table")

cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_notifications_user 
    ON notifications(user_id, is_read, created_at DESC)
""")
conn.commit()
print("[OK] Created index")

cur.close()
conn.close()
print("[DONE]")