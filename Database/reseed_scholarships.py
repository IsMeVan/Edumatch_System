import json
import os
import re
import psycopg2
from dotenv import load_dotenv

load_dotenv("../.env")

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

# ─── Manual fixes for tricky name variations ───
MANUAL_OVERRIDES = {
    # Cham Sim - different spacing
    "សាកលវិទ្យាល័យជាតិ ជា ស៊ីម កំចាយមារ": "សាកលវិទ្យាល័យជាតិជាស៊ីមកំចាយមារ",
    "សាកលវិទ្យាល័យជាតិ ជា ស៊ីម កំចាយមារ (ខេត្តកំពង់ចាម)": "សាកលវិទ្យាល័យជាតិ ជា ស៊ីម កំចាយមារ ខេត្តកំពង់ចាម",

    # Management & Economics - parentheses → main school (region is in DB metadata)
    "សាកលវិទ្យាល័យគ្រប់គ្រង និងសេដ្ឋកិច្ច (បាត់ដំបង)": "សាកលវិទ្យាល័យគ្រប់គ្រង និងសេដ្ឋកិច្ច",

    # Specialized University of Cambodia branches
    "សាកលវិទ្យាល័យ ឯកទេស នៃកម្ពុជា (កំពង់ធំ)": "សាកលវិទ្យាល័យឯកទេសនៃកម្ពុជា ខេត្តកំពង់ធំ",
    "សាកលវិទ្យាល័យ ឯកទេស នៃកម្ពុជា (សៀមរាប)": "សាកលវិទ្យាល័យឯកទេសនៃកម្ពុជា ខេត្តសៀមរាប",
    "សាកលវិទ្យាល័យ ឯកទេស នៃកម្ពុជា (បន្ទាយមានជ័យ)": "សាកលវិទ្យាល័យឯកទេស នៃកម្ពុជា ខេត្តបន្ទាយមានជ័យ",
    "សាកលវិទ្យាល័យ ឯកទេស នៃកម្ពុជា (បាត់ដំបង)": "សាកលវិទ្យាល័យឯកទេសនៃកម្ពុជា ខេត្តបាត់ដំបង",

    # Acleda - extra space difference
    "សាកលវិទ្យាល័យពាណិជ្ជសាស្ត្រ អេស៊ីលីដា": "សាកលវិទ្យាល័យ ពាណិជ្ជសាស្ត្រ អេស៊ីលីដា",

    # Other typos / spelling differences
    "សាកលវិទ្យាល័យបញ្ញាជាតិ": "សាកលវិទ្យាល័យបញ្ញាសាស្ត្រកម្ពុជា",
    "សាកលវិទ្យាល័យសម្តេចព្រះមហាសង្ឃរាជ បូរ គ្រី": "សាកលវិទ្យាល័យសម្តេចព្រះមហាសង្ឃរាជ បួរ គ្រី",
    "វិទ្យាស្ថានកសិកម្មឧកញ៉ា ម៉ុង ឫទ្ធី": "វិទ្យាស្ថានកសិកម្ម ឧកញ៉ា ម៉ុង ឫទ្ធី",

    # Truly missing from DB (intentionally skipped)
    "វិទ្យាស្ថានបច្ចេកវិទ្យាកម្ពុជា ខេត្តកែប": None,
    "សាកលវិទ្យាល័យ ឯកទេស នៃកម្ពុជា (កំពង់ចាម)": None,
}


def normalize(name: str) -> str:
    """Convert variations to match DB format."""
    # Remove "សាខា" prefix
    if name.startswith("សាខា"):
        name = name[len("សាខា"):]

    # Convert (XXX) to ខេត្តXXX
    match = re.search(r'\(([^)]+)\)', name)
    if match:
        inner = match.group(1).strip()
        # If "ភ្នំពេញ" → main campus (no region suffix)
        if "ភ្នំពេញ" in inner:
            name = re.sub(r'\s*\([^)]+\)\s*', '', name).strip()
        else:
            # Add ខេត្ត prefix if not there
            if not inner.startswith("ខេត្ត"):
                inner = "ខេត្ត" + inner
            name = re.sub(r'\s*\([^)]+\)\s*', '', name).strip() + " " + inner

    return name.strip()


# Load all schools from DB
cur.execute("SELECT id, name_kh FROM institutions")
db_schools = {row[1]: row[0] for row in cur.fetchall()}


def find_school_id(json_name: str):
    """Find DB school ID for a JSON school name."""
    # 1. Manual overrides first
    if json_name in MANUAL_OVERRIDES:
        target = MANUAL_OVERRIDES[json_name]
        if target is None:
            return None
        return db_schools.get(target)

    # 2. Exact match
    if json_name in db_schools:
        return db_schools[json_name]

    # 3. Normalized match
    normalized = normalize(json_name)
    if normalized in db_schools:
        return db_schools[normalized]

    return None


# Load JSON
with open("../data/stem_scholarshipp.json", "r", encoding="utf-8") as f:
    data = json.load(f)


# ─── DELETE existing scholarship data (clean re-seed) ───
print("Clearing old scholarship data...")
cur.execute("UPDATE recommendations SET scholarship_id = NULL WHERE scholarship_id IS NOT NULL")
cur.execute("DELETE FROM scholarship_majors")
cur.execute("DELETE FROM scholarships")
conn.commit()
print("Cleared.\n")


# ─── Insert scholarships ───
matched = 0
skipped = 0
inserted_count = 0

for entry in data:
    school_name = entry["school"].strip()
    school_id = find_school_id(school_name)

    if school_id is None:
        skipped += 1
        print(f"✗ SKIP (no match): {school_name}")
        continue

    matched += 1
    print(f"✓ MATCH: {school_name} → school_id={school_id}")

    for sch in entry.get("scholarships", []):
        # Insert scholarship
        quota = sch.get("total_quota_breakdown") or {}
        cur.execute("""
            INSERT INTO scholarships (
                institution_id, scholarship_name, academic_year, category,
                coverage_percentage, total_scholarships, eligibility_criteria,
                quota_general, quota_female, quota_poor, quota_remote
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            school_id,
            sch.get("scholarship_name"),
            sch.get("academic_year"),
            sch.get("category"),
            sch.get("coverage_percentage"),
            sch.get("total_scholarships"),
            sch.get("eligibility_criteria") or [],
            quota.get("general"),
            quota.get("female"),
            quota.get("poor"),
            quota.get("remote_areas"),
        ))
        scholarship_id = cur.fetchone()[0]
        inserted_count += 1

        # Insert majors using major_name_kh (text)
        for major in sch.get("majors", []):
            major_name = major.get("major_name", "").strip()
            mq = major.get("quota_breakdown") or {}

            cur.execute("""
                INSERT INTO scholarship_majors (
                    scholarship_id, major_name_kh, total_quota,
                    quota_general, quota_female, quota_poor, quota_remote,
                    specific_requirements
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                scholarship_id,
                major_name,
                major.get("total_quota"),
                mq.get("general"),
                mq.get("female"),
                mq.get("poor"),
                mq.get("remote_areas"),
                major.get("specific_requirements") or [],
            ))

conn.commit()

print(f"\n{'='*40}")
print(f"✓ Matched schools: {matched}")
print(f"✗ Skipped schools: {skipped}")
print(f"📚 Scholarships inserted: {inserted_count}")

# Verify
cur.execute("SELECT COUNT(DISTINCT institution_id) FROM scholarships")
unique_schools = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM scholarships")
total_scholarships = cur.fetchone()[0]
print(f"\nFinal DB state:")
print(f"  - Schools with scholarships: {unique_schools}")
print(f"  - Total scholarship records: {total_scholarships}")

cur.close()
conn.close()