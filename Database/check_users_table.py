"""
Show all users and their admin status.
Run: python check_users_table.py
"""
import psycopg2
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute("SELECT id, name, email, role, is_admin FROM users ORDER BY id")

print("Current users:")
print("-" * 70)
for row in cur.fetchall():
    label = "ADMIN" if row[4] else "User"
    print(f"  ID {row[0]:3d}: {row[1]:20s} {row[2]:30s} {label}")

cur.close()
conn.close()