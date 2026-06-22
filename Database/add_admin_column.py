"""
Promote a user to admin.
Usage: python make_admin.py <email>
"""
import psycopg2
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

if len(sys.argv) < 2:
    print("Usage: python make_admin.py <email>")
    sys.exit(1)

email = sys.argv[1].lower().strip()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Find which "name" column exists
cur.execute("""
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('username', 'name', 'full_name', 'first_name', 'display_name')
    LIMIT 1
""")
result = cur.fetchone()
name_col = result[0] if result else 'email'

# Find user
cur.execute(f"SELECT id, {name_col}, email, is_admin FROM users WHERE LOWER(email) = %s", (email,))
user = cur.fetchone()

if not user:
    print(f"[ERROR] No user with email: {email}")
    print("\nExisting users:")
    cur.execute("SELECT email FROM users ORDER BY id")
    for r in cur.fetchall():
        print(f"  - {r[0]}")
    sys.exit(1)

uid, uname, em, is_adm = user

if is_adm:
    print(f"[INFO] {uname} is already admin!")
else:
    cur.execute("UPDATE users SET is_admin = TRUE WHERE id = %s", (uid,))
    conn.commit()
    print(f"[OK] Promoted {uname} ({em}) to ADMIN! 👑")

cur.close()
conn.close()