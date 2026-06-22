"""
FORCE add the 3 truly missing schools — FIXED for schema with institution_id.
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')


SCHOOLS = [
    {
        "name_kh": "សាកលវិទ្យាល័យគ្រប់គ្រងអាស៊ីបូព៌ា",
        "type": "គ្រឹះស្ថានឧត្តមសិក្សាឯកជន",
        "region": "រាជធានីភ្នំពេញ",
        "address": "អគារលេខ៦១០ មហាវិថីឧកញ៉ាឃ្លាំងមឿង សង្កាត់ទួលសង្កែ ខណ្ឌឫស្សីកែវ រាជធានីភ្នំពេញ",
        "phones": ["០១៥ ៩០៧ ៩៥៧", "០១៧ ៩០៧ ៩៥៧"],
        "departments": [
            {
                "name_kh": "មហាវិទ្យាល័យ ធុរកិច្ច និងគ្រប់គ្រង",
                "majors": [
                    "គណនេយ្យ",
                    "ទីផ្សារ",
                    "ធនាគារនិងហិរញ្ញវត្ថុ",
                    "គណនេយ្យនិងហិរញ្ញវត្ថុ",
                    "គ្រប់គ្រងធុរកិច្ច",
                    "គ្រប់គ្រងធុរកិច្ចអន្តរជាតិ",
                    "គ្រប់គ្រងភ័ស្តុភារ និងបណ្ដាញផ្គត់ផ្គង់",
                ],
            },
            {
                "name_kh": "មហាវិទ្យាល័យ គ្រប់គ្រង និងទេសចរណ៍",
                "majors": [
                    "គ្រប់គ្រងទេសចរណ៍និងបដិសណ្ឋារកិច្ច",
                    "គ្រប់គ្រងព្រឹត្តការណ៍និងសន្និសីទ",
                    "គ្រប់គ្រងកាស៊ីណូ",
                    "ការសិក្សាអំពីចំណីអាហារនិងការចម្អិន",
                ],
            },
            {
                "name_kh": "មហាវិទ្យាល័យ វិស្វកម្ម",
                "majors": [
                    "អក្សរសាស្ត្រខ្មែរ",
                    "ភាសាអង់គ្លេសធុរកិច្ច",
                    "ការបង្រៀនភាសាអង់គ្លេស",
                    "ការអប់រំកុមារតូច",
                    "ការអប់រំបឋមសិក្សា",
                    "ការអប់រំមធ្យមសិក្សា",
                    "ការអប់រំឧត្តមសិក្សា",
                ],
            },
            {
                "name_kh": "មហាវិទ្យាល័យ វិទ្យាសាស្ត្រសង្គម និងសេដ្ឋកិច្ច",
                "majors": [
                    "ចិត្តវិទ្យា",
                    "សេដ្ឋកិច្ច",
                    "ច្បាប់",
                ],
            },
            {
                "name_kh": "មហាវិទ្យាល័យ វិទ្យាសាស្ត្រ និងបច្ចេកវិទ្យា",
                "majors": [
                    "ប្រព័ន្ធព័ត៌មានធុរកិច្ច",
                    "កុំព្យូទ័រនិងបណ្តាញ",
                    "ការរចនានិងវិភាគប្រព័ន្ធ",
                ],
            },
            {
                "name_kh": "សាលាក្រោយបរិញ្ញាបត្រ",
                "majors": [
                    "រដ្ឋបាលធុរកិច្ច",
                    "ធុរកិច្ចអន្តរជាតិ",
                    "ទីផ្សារ",
                    "ហិរញ្ញវត្ថុ",
                    "គ្រប់គ្រងធនធានមនុស្ស",
                    "គ្រប់គ្រងធុរកិច្ច",
                ],
            },
            {
                "name_kh": "មជ្ឈមណ្ឌលបណ្តុះបណ្តាលបច្ចេកទេស និងវិជ្ជាជីវៈ",
                "majors": [],
            },
        ],
    },
    {
        "name_kh": "វិទ្យាស្ថានបច្ចេកទេស រ៉ូយ៉ាល់ ឆាតធឺ",
        "type": "គ្រឹះស្ថានឧត្តមសិក្សាឯកជន",
        "region": "រាជធានីភ្នំពេញ",
        "address": "អគារលេខ៥២៣ មហាវិថីព្រះមុនីរ៉េត ជាន់ទី១ ផ្សារទំនើបស្ទឹងមានជ័យ សង្កាត់ស្ទឹងមានជ័យ ខណ្ឌមានជ័យ រាជធានីភ្នំពេញ",
        "phones": ["០២៣ ៩០១ ៣៧៩", "០៧៧ ៣៧៧ ១៤៨"],
        "departments": [
            {
                "name_kh": "ជំនាញបច្ចេកទេស",
                "majors": [
                    "ការស្ទង់បរិមាណសំណង់",
                    "គ្រប់គ្រងសំណង់",
                    "គ្រប់គ្រងអគារ",
                    "វាយតម្លៃអចលទ្រព្យ",
                ],
            },
        ],
    },
    {
        "name_kh": "សាកលវិទ្យាល័យ ឯកទេស នៃកម្ពុជា ខេត្តកំពង់ចាម",
        "type": "គ្រឹះស្ថានឧត្តមសិក្សាឯកជន",
        "region": "ខេត្តកំពត",
        "address": "អគារ២១ ផ្លូវលេខ៧២៩ ភូមិ១ឧសភា សង្កាត់កំពង់កណ្តាល ក្រុងកំពត ខេត្តកំពត",
        "phones": ["០១២ ៧៦៩ ២២០", "០៦៩ ៥៥៥ ៨១១"],
        "departments": [
            {
                "name_kh": "មហាវិទ្យាល័យ សិល្បៈ មនុស្សសាស្ត្រ និងភាសា",
                "majors": [
                    "អក្សរសាស្ត្រអង់គ្លេស",
                    "អក្សរសាស្ត្រខ្មែរ",
                    "ប្រវត្តិវិទ្យា",
                    "ភូមិវិទ្យា",
                    "គ្រប់គ្រងអប់រំ",
                    "ចិត្តគរុកោសល្យ",
                ],
            },
            {
                "name_kh": "មហាវិទ្យាល័យ គ្រប់គ្រងពាណិជ្ជកម្ម និងសេដ្ឋកិច្ច",
                "majors": [
                    "គ្រប់គ្រង",
                    "គណនេយ្យ",
                    "ម៉ាឃីតធីង",
                    "គ្រប់គ្រងពាណិជ្ជកម្ម",
                    "សេដ្ឋកិច្ចអភិវឌ្ឍន៍",
                    "ហិរញ្ញវត្ថុនិងធនាគារ",
                    "គ្រប់គ្រងហិរញ្ញវត្ថុ",
                    "ពាណិជ្ជកម្មអន្តរជាតិ",
                    "គ្រប់គ្រងធនធានមនុស្ស",
                    "គ្រប់គ្រងទេសចរណ៍",
                    "គណនេយ្យនិងហិរញ្ញវត្ថុ",
                    "គ្រប់គ្រងពាណិជ្ជកម្មអន្តរជាតិ",
                    "គ្រប់គ្រងការផ្សាយពាណិជ្ជកម្ម",
                    "គ្រប់គ្រងអចលនវត្ថុនិងដីធ្លី",
                    "គ្រប់គ្រងសណ្ឋាគារ-ទេសចរណ៍",
                ],
            },
            {
                "name_kh": "មហាវិទ្យាល័យ វិទ្យាសាស្ត្រ និងបច្ចេកវិទ្យា",
                "majors": [
                    "គណិតវិទ្យា",
                    "រូបវិទ្យា",
                    "ជីវវិទ្យា",
                    "គីមីវិទ្យា",
                    "វិទ្យាសាស្ត្រកុំព្យូទ័រ",
                    "គ្រប់គ្រងស្ថិតិអនុវត្តន៍",
                    "បច្ចេកវិទ្យាព័ត៌មានវិទ្យា",
                    "គ្រប់គ្រងប្រព័ន្ធព័ត៌មាន",
                ],
            },
            {
                "name_kh": "មហាវិទ្យាល័យ វិទ្យាសាស្ត្រសង្គម និងនីតិសាស្ត្រ",
                "majors": [
                    "នីតិសាធារណៈ",
                    "នីតិឯកជន",
                    "នីតិសាស្ត្រ",
                    "វិទ្យាសាស្ត្រនយោបាយ",
                ],
            },
        ],
    },
]


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Before count
    cur.execute("SELECT COUNT(*) FROM institutions")
    before = cur.fetchone()[0]
    print(f"\nSchools in DB before: {before}\n")
    print("=" * 70)

    for school_idx, school in enumerate(SCHOOLS, 1):
        name = school["name_kh"]
        print(f"\n[{school_idx}/{len(SCHOOLS)}] {name}")
        print("-" * 70)

        # Check if exists
        cur.execute("SELECT id FROM institutions WHERE name_kh = %s", (name,))
        existing = cur.fetchone()
        if existing:
            print(f"  ⚠ Already exists with ID {existing[0]} — SKIPPING")
            continue

        try:
            # Insert school
            print(f"  Inserting institution...")
            cur.execute("""
                INSERT INTO institutions (name_kh, type, region, address, phones)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (
                name,
                school["type"],
                school["region"],
                school["address"],
                school["phones"],
            ))
            school_id = cur.fetchone()[0]
            print(f"  ✓ Institution inserted with ID {school_id}")

            # Insert departments + majors
            dept_count = 0
            major_count = 0

            for dept in school["departments"]:
                cur.execute("""
                    INSERT INTO departments (institution_id, name_kh)
                    VALUES (%s, %s)
                    RETURNING id
                """, (school_id, dept["name_kh"]))
                dept_id = cur.fetchone()[0]
                dept_count += 1

                for major_name in dept["majors"]:
                    if not major_name.strip():
                        continue
                    # FIX: Insert BOTH department_id AND institution_id
                    cur.execute("""
                        INSERT INTO majors (department_id, institution_id, name_kh)
                        VALUES (%s, %s, %s)
                    """, (dept_id, school_id, major_name.strip()))
                    major_count += 1

            # COMMIT this school
            conn.commit()
            print(f"  ✓ Added {dept_count} departments, {major_count} majors")
            print(f"  ✓ COMMITTED to DB")

        except Exception as e:
            print(f"  ✗ ERROR: {e}")
            print(f"  Rolling back this school...")
            conn.rollback()

    # After count
    cur.execute("SELECT COUNT(*) FROM institutions")
    after = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM departments")
    total_depts = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM majors")
    total_majors = cur.fetchone()[0]

    cur.close()
    conn.close()

    print("\n" + "=" * 70)
    print("FINAL RESULT:")
    print("=" * 70)
    print(f"  Schools before: {before}")
    print(f"  Schools after:  {after}")
    print(f"  Schools added:  {after - before}")
    print(f"  Total departments: {total_depts}")
    print(f"  Total majors:      {total_majors}")
    print("=" * 70)


if __name__ == "__main__":
    main()