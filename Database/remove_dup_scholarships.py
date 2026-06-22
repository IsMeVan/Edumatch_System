"""
Remove duplicate scholarships (same name + same school).
Keeps the one with the lower ID, deletes the higher ID.
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Before count
cur.execute("SELECT COUNT(*) FROM scholarships")
before = cur.fetchone()[0]
print(f"Scholarships before: {before}\n")

# Find duplicates — keep lowest ID, mark higher IDs for deletion
cur.execute("""
    SELECT institution_id, scholarship_name, array_agg(id ORDER BY id) as ids
    FROM scholarships
    GROUP BY institution_id, scholarship_name
    HAVING COUNT(*) > 1
""")

dups = cur.fetchall()
print(f"Found {len(dups)} sets of duplicates\n")

deleted_total = 0
for inst_id, name, ids in dups:
    keep = ids[0]
    delete = ids[1:]
    print(f"School {inst_id}: {name[:50]}")
    print(f"  Keep ID: {keep}")
    print(f"  Delete IDs: {delete}")
    
    # Also delete related scholarship_majors (FK cascade should handle this,
    # but being explicit)
    for del_id in delete:
        # Delete from recommendations if any pointed here
        cur.execute("UPDATE recommendations SET scholarship_id = NULL WHERE scholarship_id = %s", (del_id,))
        # Delete scholarship (cascades to scholarship_majors)
        cur.execute("DELETE FROM scholarships WHERE id = %s", (del_id,))
        deleted_total += 1

conn.commit()

# After count
cur.execute("SELECT COUNT(*) FROM scholarships")
after = cur.fetchone()[0]

cur.close()
conn.close()

print(f"\n{'=' * 50}")
print(f"Scholarships before: {before}")
print(f"Scholarships after:  {after}")
print(f"Deleted:             {deleted_total}")
print(f"{'=' * 50}")