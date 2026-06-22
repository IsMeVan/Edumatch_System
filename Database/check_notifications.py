"""
Check if notifications table exists and show recent notifications.
"""
import psycopg2
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Check if table exists
cur.execute("""
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
    )
""")
exists = cur.fetchone()[0]
print(f"notifications table exists: {exists}")

if exists:
    # Show columns
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'notifications'
        ORDER BY ordinal_position
    """)
    print("\nColumns:")
    for row in cur.fetchall():
        print(f"  - {row[0]}: {row[1]}")
    
    # Show recent notifications
    cur.execute("""
        SELECT id, user_id, title, message, type, is_read, created_at 
        FROM notifications 
        ORDER BY created_at DESC 
        LIMIT 10
    """)
    rows = cur.fetchall()
    print(f"\nTotal recent notifications: {len(rows)}")
    for r in rows:
        status = "READ" if r[5] else "UNREAD"
        title = r[2] or r[3][:50]
        print(f"  ID {r[0]}: to user {r[1]} | {status} | {title}")

cur.close()
conn.close()
print("\n[DONE]")