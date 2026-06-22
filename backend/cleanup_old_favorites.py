"""
Drop the old 'favorites' table (empty, replaced by user_favorites).
Run: python cleanup_old_favorites.py
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
print("Cleanup old favorites system")
print("=" * 60)

# Check if old table exists and is empty
cur.execute("SELECT COUNT(*) FROM favorites")
count = cur.fetchone()[0]

if count == 0:
    print(f"\n[OK] Old 'favorites' table is empty ({count} rows)")
    print("[+] Dropping it...")
    cur.execute("DROP TABLE IF EXISTS favorites")
    conn.commit()
    print("[OK] Dropped old 'favorites' table")
else:
    print(f"\n[WARN] Old 'favorites' table has {count} rows!")
    print("Run this manually if you want to migrate data first.")
    response = input("Drop anyway? (yes/no): ")
    if response.lower() == 'yes':
        cur.execute("DROP TABLE IF EXISTS favorites")
        conn.commit()
        print("[OK] Dropped old table")
    else:
        print("[SKIP] Old table kept.")

# Verify
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE '%favorit%'
""")
remaining = [r[0] for r in cur.fetchall()]
print(f"\nRemaining favorites tables: {remaining}")

# Show user_favorites count
cur.execute("SELECT COUNT(*) FROM user_favorites")
new_count = cur.fetchone()[0]
print(f"user_favorites has {new_count} rows (preserved)")

cur.close()
conn.close()
print("\n[DONE]")