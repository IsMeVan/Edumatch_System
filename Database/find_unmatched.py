import json
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("../.env")

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

# Load JSON
with open("../data/stem_scholarshipp.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total school groups in JSON: {len(data)}")
print()

# Get all schools in DB
cur.execute("SELECT id, name_kh FROM institutions")
db_schools = {row[1]: row[0] for row in cur.fetchall()}
print(f"Total schools in DB: {len(db_schools)}")
print()

matched = []
unmatched = []

for entry in data:
    school_name = entry["school"].strip()
    if school_name in db_schools:
        matched.append(school_name)
    else:
        unmatched.append(school_name)

print(f"✓ Matched: {len(matched)}")
print(f"✗ Unmatched: {len(unmatched)}")
print()

print("=== UNMATCHED SCHOOLS ===")
for name in unmatched:
    print(f"  - {name}")

    # Try to find close matches
    similar = [
        db_name for db_name in db_schools
        if name[:15] in db_name or db_name[:15] in name
    ]
    if similar:
        print(f"    Possible matches in DB:")
        for s in similar[:3]:
            print(f"      → {s}")
    print()

cur.close()
conn.close()