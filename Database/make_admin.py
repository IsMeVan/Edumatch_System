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
    print("Example: python make_admin.py sok@gmail.com")
    sys.exit(1)

email = sys.argv[1].lower().strip()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute(
    "SELECT id, name, email, is_admin FROM users WHERE LOWER(email) = %s", 
    (email,)
)
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
    print(f"[INFO] {uname} is already admin")
else:
    # Update both is_admin and role
    cur.execute(
        "UPDATE users SET is_admin = TRUE, role = 'admin' WHERE id = %s", 
        (uid,)
    )
    conn.commit()
    print(f"[OK] Promoted {uname} ({em}) to ADMIN")

cur.close()
conn.close()