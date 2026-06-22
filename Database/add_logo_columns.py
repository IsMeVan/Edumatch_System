"""
Add logo_url and image_url columns to institutions table.
Run: python add_logo_columns.py
"""
import psycopg2
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

print("=" * 60)
print("Adding logo_url and image_url columns")
print("=" * 60)

# Check existing columns
cur.execute("""
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'institutions'
""")
existing = [r[0] for r in cur.fetchall()]
print(f"Existing columns: {existing}")

# Add logo_url
if 'logo_url' not in existing:
    cur.execute("ALTER TABLE institutions ADD COLUMN logo_url VARCHAR(255)")
    print("[OK] Added logo_url column")
else:
    print("[SKIP] logo_url already exists")

# Add image_url
if 'image_url' not in existing:
    cur.execute("ALTER TABLE institutions ADD COLUMN image_url VARCHAR(255)")
    print("[OK] Added image_url column")
else:
    print("[SKIP] image_url already exists")

conn.commit()
cur.close()
conn.close()
print("\n[DONE]")