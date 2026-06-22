"""
Add region_preference column to survey_responses.
"""
import psycopg2
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

DATABASE_URL = os.getenv('DATABASE_URL')


def migrate():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    print("=" * 60)
    print("Adding region_preference column to survey_responses")
    print("=" * 60)
    
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'survey_responses'
    """)
    existing = [r[0] for r in cur.fetchall()]
    print(f"Existing columns: {existing}")
    
    if 'region_preference' not in existing:
        print("\n[+] Adding region_preference column...")
        cur.execute("""
            ALTER TABLE survey_responses 
            ADD COLUMN region_preference VARCHAR(50) DEFAULT NULL
        """)
        print("    [OK] Added")
    else:
        print("\n[=] region_preference already exists, skipping")
    
    conn.commit()
    
    cur.execute("""
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_name = 'survey_responses'
        ORDER BY ordinal_position
    """)
    print("\nFinal structure:")
    for col, dtype in cur.fetchall():
        print(f"  - {col}: {dtype}")
    
    cur.close()
    conn.close()
    print("\n[DONE]")


if __name__ == '__main__':
    migrate()