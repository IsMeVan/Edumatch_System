import json
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

DB_URL = os.getenv("DATABASE_URL")


def connect():
    return psycopg2.connect(DB_URL)


def load_institutions(cur):
    with open("../data/Structured_institutions_cleaned1.json", "r", encoding="utf-8") as f:
        raw = json.load(f)

    # flatten + deduplicate by name
    items, seen = [], set()
    for entry in raw:
        for item in (entry if isinstance(entry, list) else [entry]):
            if item["name"] not in seen:
                seen.add(item["name"])
                items.append(item)

    print(f"Institutions to load: {len(items)}")
    name_to_id = {}

    for item in items:
        contact = item.get("contact_info", {})
        cur.execute("""
            INSERT INTO institutions (name_kh, type, region, address, phones)
            VALUES (%s, %s, %s, %s, %s) RETURNING id
        """, (
            item["name"],
            item.get("type", ""),
            item.get("region", ""),
            contact.get("address", ""),
            contact.get("phones", [])
        ))
        inst_id = cur.fetchone()[0]
        name_to_id[item["name"]] = inst_id

        for dept in item.get("departments", []):
            if not isinstance(dept, dict):
                continue
            cur.execute(
                "INSERT INTO departments (institution_id, name_kh) VALUES (%s, %s) RETURNING id",
                (inst_id, dept.get("department_name", ""))
            )
            dept_id = cur.fetchone()[0]

            for major in dept.get("majors", []):
                cur.execute(
                    "INSERT INTO majors (department_id, institution_id, name_kh) VALUES (%s, %s, %s)",
                    (dept_id, inst_id, major)
                )

    print(f"Loaded {len(name_to_id)} institutions")
    return name_to_id


def load_scholarships(cur, name_to_id):
    with open("../data/stem_scholarshipp.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Scholarship groups: {len(data)}")
    count = 0

    for entry in data:
        inst_id = name_to_id.get(entry.get("school", ""))

        for sc in entry.get("scholarships", []):
            q = sc.get("total_quota_breakdown", {})
            cur.execute("""
                INSERT INTO scholarships
                    (institution_id, scholarship_name, academic_year, category,
                     coverage_percentage, total_scholarships, eligibility_criteria,
                     quota_general, quota_female, quota_poor, quota_remote)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (
                inst_id,
                sc.get("scholarship_name", ""),
                sc.get("academic_year", ""),
                sc.get("category", ""),
                sc.get("coverage_percentage", 0),
                sc.get("total_scholarships", 0),
                sc.get("eligibility_criteria", []),
                q.get("general", 0),
                q.get("female", 0),
                q.get("poor", 0),
                q.get("remote_areas", 0),
            ))
            sc_id = cur.fetchone()[0]
            count += 1

            for m in sc.get("majors", []):
                mq = m.get("quota_breakdown", {})
                cur.execute("""
                    INSERT INTO scholarship_majors
                        (scholarship_id, major_name_kh, total_quota,
                         quota_general, quota_female, quota_poor, quota_remote,
                         specific_requirements)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    sc_id,
                    m.get("major_name", ""),
                    m.get("total_quota", 0),
                    mq.get("general", 0),
                    mq.get("female", 0),
                    mq.get("poor", 0),
                    mq.get("remote_areas", 0),
                    m.get("specific_requirements", []),
                ))

    print(f"Loaded {count} scholarships")


def main():
    conn = connect()
    cur = conn.cursor()
    try:
        name_map = load_institutions(cur)
        load_scholarships(cur, name_map)
        conn.commit()
        print("Done")
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()