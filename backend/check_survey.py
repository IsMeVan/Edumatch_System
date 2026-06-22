"""
Check survey_responses table columns.
"""
import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

DATABASE_URL = os.getenv('DATABASE_URL')

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

print("=" * 60)
print("Survey Responses Table Structure")
print("=" * 60)

cur.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'survey_responses'
    ORDER BY ordinal_position
""")

rows = cur.fetchall()
if not rows:
    print("[!] Table 'survey_responses' not found!")
else:
    print(f"\nFound {len(rows)} columns:\n")
    for col_name, data_type, nullable in rows:
        nullable_text = "NULL OK" if nullable == 'YES' else "REQUIRED"
        print(f"  - {col_name:<25} {data_type:<25} ({nullable_text})")

# Also count how many surveys exist
cur.execute("SELECT COUNT(*) FROM survey_responses")
count = cur.fetchone()[0]
print(f"\nTotal surveys in DB: {count}")

# Show sample row
if count > 0:
    cur.execute("SELECT * FROM survey_responses LIMIT 1")
    sample = cur.fetchone()
    print(f"\nSample row (first survey):")
    col_names = [desc[0] for desc in cur.description]
    for col, val in zip(col_names, sample):
        val_str = str(val)[:60] if val else "(empty)"
        print(f"  - {col}: {val_str}")

cur.close()
conn.close()
print("\n" + "=" * 60)
print("[DONE]")