"""
Import the 85 major descriptions from major_name.json.
Auto-finds the JSON file anywhere in the project.

Run: python import_major_descriptions.py
"""
import psycopg2
import json
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

DATABASE_URL = os.getenv('DATABASE_URL')

# Auto-find the JSON file anywhere in the project
PROJECT_ROOT = Path(__file__).resolve().parent.parent


def find_json():
    """Search the entire project for major_name.json (or similar)."""
    print(f"[+] Searching for JSON file in: {PROJECT_ROOT}")
    
    # Try common filenames
    candidates = ['major_name.json', 'major_names.json', 'majors.json']
    
    # Search recursively
    found_files = []
    for json_file in PROJECT_ROOT.rglob('*.json'):
        # Skip node_modules, __pycache__ etc
        if any(skip in str(json_file) for skip in ['node_modules', '__pycache__', '.git']):
            continue
        if 'major' in json_file.name.lower():
            found_files.append(json_file)
    
    if not found_files:
        print(f"[ERROR] No major-related JSON files found!")
        return None
    
    print(f"\n[+] Found {len(found_files)} candidate(s):")
    for i, f in enumerate(found_files):
        print(f"    {i+1}. {f}")
    
    # If multiple, prefer major_name.json
    for f in found_files:
        if f.name == 'major_name.json':
            print(f"\n[OK] Using: {f}")
            return f
    
    # Otherwise, use the first one
    print(f"\n[OK] Using: {found_files[0]}")
    return found_files[0]


def setup():
    print("=" * 60)
    print("Setting up major_descriptions table")
    print("=" * 60)
    
    # Find JSON
    json_path = find_json()
    if not json_path:
        print("\n[ERROR] Cannot continue without JSON file.")
        return
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Create table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS major_descriptions (
            id SERIAL PRIMARY KEY,
            name_kh VARCHAR(200) NOT NULL UNIQUE,
            name_en VARCHAR(200),
            prerequisites TEXT,
            degree_requirements TEXT,
            skills_and_knowledge TEXT,
            career_opportunities TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cur.execute("CREATE INDEX IF NOT EXISTS idx_major_desc_name_kh ON major_descriptions(name_kh)")
    
    print("[OK] Table ready")
    
    # Load JSON
    print(f"\n[+] Loading...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"    Found {len(data)} majors")
    
    # Insert each major
    print("\n[+] Importing...")
    inserted = 0
    updated = 0
    errors = 0
    
    for major in data:
        name_kh = major.get('major_name_km', '').strip()
        name_en = major.get('major_name_en', '').strip()
        prereq = major.get('prerequisites', '').strip()
        degree_req = major.get('degree_requirements', '').strip()
        
        skills = major.get('skills_and_knowledge', [])
        if isinstance(skills, list):
            skills = ' | '.join(skills)
        
        careers = major.get('career_opportunities', [])
        if isinstance(careers, list):
            careers = ' | '.join(careers)
        
        if not name_kh:
            continue
        
        try:
            cur.execute("""
                INSERT INTO major_descriptions 
                    (name_kh, name_en, prerequisites, degree_requirements, 
                     skills_and_knowledge, career_opportunities)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (name_kh) DO UPDATE SET
                    name_en = EXCLUDED.name_en,
                    prerequisites = EXCLUDED.prerequisites,
                    degree_requirements = EXCLUDED.degree_requirements,
                    skills_and_knowledge = EXCLUDED.skills_and_knowledge,
                    career_opportunities = EXCLUDED.career_opportunities
                RETURNING xmax = 0 as inserted
            """, (name_kh, name_en, prereq, degree_req, skills, careers))
            
            is_new = cur.fetchone()[0]
            if is_new:
                inserted += 1
            else:
                updated += 1
        except Exception as e:
            print(f"  [ERROR] {name_kh}: {e}")
            errors += 1
    
    conn.commit()
    
    print(f"\n[OK] Inserted: {inserted}, Updated: {updated}, Errors: {errors}")
    
    # Verify
    cur.execute("SELECT COUNT(*) FROM major_descriptions")
    total = cur.fetchone()[0]
    print(f"[OK] Total in DB: {total}")
    
    # Show match with existing majors
    cur.execute("""
        SELECT COUNT(DISTINCT m.name_kh) as matched
        FROM majors m
        INNER JOIN major_descriptions md ON md.name_kh = m.name_kh
    """)
    matched = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(DISTINCT name_kh) FROM majors")
    total_unique = cur.fetchone()[0]
    
    print(f"\n[INFO] Matching with majors table:")
    print(f"  - Total unique major names in DB: {total_unique}")
    print(f"  - Matched with descriptions: {matched}")
    if total_unique > 0:
        print(f"  - Coverage: {matched / total_unique * 100:.1f}%")
    
    # Show sample
    cur.execute("""
        SELECT name_kh, name_en, 
               LEFT(career_opportunities, 80) as careers
        FROM major_descriptions 
        ORDER BY id LIMIT 3
    """)
    print("\nSample entries:")
    for row in cur.fetchall():
        print(f"\n  {row[0]} ({row[1]})")
        print(f"  Careers: {row[2]}...")
    
    cur.close()
    conn.close()
    print("\n[DONE]")


if __name__ == '__main__':
    setup()