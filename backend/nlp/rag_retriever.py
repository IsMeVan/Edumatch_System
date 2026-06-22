"""
RAG Retriever — searches the database for relevant info to answer chat questions.
Improved: extracts keywords + maps abbreviations (RUPP, ITC) to real Khmer names.
"""
import re
from db.database import get_pool


# ─── ALIAS DICTIONARY ───
# Maps abbreviations / English nicknames → Khmer search terms that exist in DB
SCHOOL_ALIASES = {
    # Public universities
    'rupp': 'ភូមិន្ទភ្នំពេញ',                # Royal University of Phnom Penh
    'rua': 'ភូមិន្ទកសិកម្ម',                  # Royal University of Agriculture
    'rule': 'នីតិសាស្ត្រ',                    # Royal University of Law and Economics
    'rufa': 'ភូមិន្ទវិចិត្រសិល្បៈ',           # Royal University of Fine Arts
    'itc': 'បច្ចេកវិទ្យាកម្ពុជា',             # Institute of Technology of Cambodia
    'num': 'ជាតិគ្រប់គ្រង',                  # National University of Management
    'nubb': 'ជាតិបាត់ដំបង',                 # National University of Battambang
    'nutsk': 'ស៊ីហានុ',                       # National University of Technology Sihanouk
    'uhs': 'វិទ្យាសាស្ត្រសុខាភិបាល',          # University of Health Sciences
    'rac': 'ភូមិន្ទរដ្ឋបាល',                  # Royal Academy of Cambodia
    'rtc': 'បច្ចេកទេសសេដ្ឋកិច្ច',            # Royal Tech College
    
    # Private universities
    'puc': 'ប៉ាណាសាស្ត្រ',                  # Pannasastra University of Cambodia
    'auc': 'អាស៊ីអ៊ឺរ៉ុប',                     # Asia Euro University
    'norton': 'នតុន',                         # Norton University
    'iic': 'អន្តរជាតិសហប្រតិបត្តិការ',         # IIC University
    'uc': 'កម្ពុជា',                          # University of Cambodia
    'cup': 'ភ្នំពេញ',                          # Cambodian University for Specialties
    'wkc': 'វេស្ទើនកាមបូឌា',                # Western University Cambodia
    'mvu': 'មេគង្គ',                          # Mean Chey / Mekong
    'asean': 'អាស៊ាន',                       # ASEAN University
    'limkokwing': 'លីមកុកវីង',              # Limkokwing
    'beltei': 'ប៊ែលធី',                       # BELTEI
    
    # English aliases that might appear
    'royal university of phnom penh': 'ភូមិន្ទភ្នំពេញ',
    'institute of technology': 'បច្ចេកវិទ្យាកម្ពុជា',
    'national university of management': 'ជាតិគ្រប់គ្រង',
    'pannasastra': 'ប៉ាណាសាស្ត្រ',
}


# Common school name keywords (used for detection — actual search uses aliases above)
SCHOOL_NAME_HINTS = [
    # Generic Khmer
    'សាកលវិទ្យាល័យ', 'វិទ្យាស្ថាន', 'ពុទ្ធិកសាកលវិទ្យាល័យ',
    # All aliases
    *SCHOOL_ALIASES.keys(),
    # Plus the Khmer values too (so direct Khmer search works)
    *SCHOOL_ALIASES.values(),
]


# Regions
REGIONS = [
    'ភ្នំពេញ', 'បាត់ដំបង', 'សៀមរាប', 'កំពង់ចាម', 'កំពង់ឆ្នាំង',
    'កំពង់ស្ពឺ', 'កំពង់ធំ', 'ស្វាយរៀង', 'ត្បូងឃ្មុំ', 'ក្រចេះ',
    'ព្រៃវែង', 'តាកែវ', 'កំពត', 'ព្រះសីហនុ', 'រតនគិរី',
    'ស្ទឹងត្រែង', 'មណ្ឌលគិរី', 'ប៉ៃលិន', 'កោះកុង', 'ឧត្តរមានជ័យ',
    'បន្ទាយមានជ័យ', 'ពោធិ៍សាត់',
    'phnom penh', 'battambang', 'siem reap', 'kampong cham',
    'sihanouk', 'kep', 'takeo', 'kampot',
]


# Common majors
MAJOR_KEYWORDS = [
    'វិទ្យាសាស្ត្រកុំព្យូទ័រ', 'វិទ្យាសាស្ត្រ', 'វិស្វកម្ម',
    'គណិត', 'រូបវិទ្យា', 'គីមីវិទ្យា', 'ជីវវិទ្យា',
    'ភាសាអង់គ្លេស', 'ភាសាបារាំង', 'ភាសាជប៉ុន', 'ភាសាកូរ៉េ',
    'អក្សរសាស្ត្រ', 'ប្រវត្តិវិទ្យា', 'ចិត្តវិទ្យា',
    'គណនេយ្យ', 'ហិរញ្ញវត្ថុ', 'ធនាគារ', 'ទីផ្សារ',
    'គ្រប់គ្រង', 'ពាណិជ្ជកម្ម', 'ទេសចរណ៍',
    'វេជ្ជសាស្ត្រ', 'ឱសថ', 'ទន្ត', 'ច្បាប់', 'នីតិសាស្ត្រ',
    'computer', 'science', 'engineering', 'mathematics', 'physics',
    'chemistry', 'biology', 'english', 'french', 'japanese', 'korean',
    'history', 'psychology', 'accounting', 'finance', 'banking',
    'marketing', 'management', 'business', 'tourism',
    'medicine', 'pharmacy', 'dentistry', 'law',
]


def _get_conn():
    pool = get_pool()
    return pool.getconn(), pool


def _release_conn(conn, pool):
    pool.putconn(conn)


def expand_alias(keyword: str) -> str:
    """If keyword is an abbreviation/alias, return its Khmer search term."""
    return SCHOOL_ALIASES.get(keyword.lower(), keyword)


def extract_keywords(query: str) -> dict:
    """Extract relevant keywords from a query."""
    query_lower = query.lower()
    
    result = {
        'school_names': [],
        'regions': [],
        'majors': [],
        'asks_scholarship': False,
        'asks_stats': False,
        'asks_location': False,
    }
    
    # Find school name hints (case-insensitive, sorted by length so longer matches first)
    sorted_hints = sorted(set(SCHOOL_NAME_HINTS), key=len, reverse=True)
    for hint in sorted_hints:
        if hint.lower() in query_lower:
            # Avoid duplicates
            if hint.lower() not in [s.lower() for s in result['school_names']]:
                result['school_names'].append(hint)
    
    # Find regions
    for region in REGIONS:
        if region.lower() in query_lower:
            if region.lower() not in [r.lower() for r in result['regions']]:
                result['regions'].append(region)
    
    # Find majors
    for major in MAJOR_KEYWORDS:
        if major.lower() in query_lower:
            if major.lower() not in [m.lower() for m in result['majors']]:
                result['majors'].append(major)
    
    # Detect intent
    scholarship_words = ['អាហារូបករណ៍', 'អាហារូប', 'scholarship', 'tuition']
    if any(w in query_lower for w in scholarship_words):
        result['asks_scholarship'] = True
    
    stats_words = ['ប៉ុន្មាន', 'សរុប', 'how many', 'total', 'count']
    if any(w in query_lower for w in stats_words):
        result['asks_stats'] = True
    
    location_words = ['នៅឯណា', 'ឯណា', 'where', 'location', 'address', 'ទីតាំង']
    if any(w in query_lower for w in location_words):
        result['asks_location'] = True
    
    return result


def search_schools_by_keyword(keyword: str, limit: int = 5) -> list:
    """Search for schools by name keyword. Auto-expands aliases."""
    # ✨ KEY FIX: convert "rupp" → "ភូមិន្ទភ្នំពេញ" before searching DB
    search_term = expand_alias(keyword)
    
    conn, pool = _get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, name_kh, type, region, address, phones
            FROM institutions
            WHERE name_kh ILIKE %s
            LIMIT %s
        """, (f'%{search_term}%', limit))
        rows = cur.fetchall()
        results = [{
            "id": row[0],
            "name": row[1],
            "type": row[2],
            "region": row[3],
            "address": row[4],
            "phones": row[5] or [],
        } for row in rows]
        
        if results:
            print(f"[Retriever] '{keyword}' → '{search_term}' → found {len(results)} schools")
        else:
            print(f"[Retriever] '{keyword}' → '{search_term}' → NO matches in DB")
        
        return results
    finally:
        cur.close()
        _release_conn(conn, pool)


def get_school_full_info(school_id: int) -> dict:
    conn, pool = _get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, name_kh, type, region, address, phones
            FROM institutions WHERE id = %s
        """, (school_id,))
        row = cur.fetchone()
        if not row:
            return None

        school = {
            "id": row[0],
            "name": row[1],
            "name_kh": row[1],
            "type": row[2],
            "region": row[3],
            "address": row[4],
            "phones": row[5] or [],
            "departments": [],
            "majors": [],
            "scholarships": [],
        }

        # Departments
        cur.execute("""
            SELECT d.id, d.name_kh,
                   COALESCE(array_agg(m.name_kh) FILTER (WHERE m.name_kh IS NOT NULL), '{}') as majors
            FROM departments d
            LEFT JOIN majors m ON m.department_id = d.id
            WHERE d.institution_id = %s
            GROUP BY d.id, d.name_kh
            ORDER BY d.id
        """, (school_id,))
        for d_row in cur.fetchall():
            dept_majors = list(d_row[2]) if d_row[2] else []
            school["departments"].append({
                "name_kh": d_row[1],
                "name": d_row[1],
                "majors": dept_majors,
            })
            # Flatten all majors at school level too
            for m in dept_majors:
                if m and {"name_kh": m} not in school["majors"]:
                    school["majors"].append({"name_kh": m})

        # Scholarships
        cur.execute("""
            SELECT id, scholarship_name, academic_year, category,
                   coverage_percentage, total_scholarships,
                   quota_general, quota_female, quota_poor, quota_remote
            FROM scholarships WHERE institution_id = %s
        """, (school_id,))
        for s_row in cur.fetchall():
            school["scholarships"].append({
                "scholarship_name": s_row[1],
                "name": s_row[1],
                "year": s_row[2],
                "category": s_row[3],
                "coverage_percentage": s_row[4],
                "coverage": s_row[4],
                "total_slots": s_row[5],
                "quota_general": s_row[6],
                "quota_female": s_row[7],
                "quota_poor": s_row[8],
                "quota_remote": s_row[9],
            })

        return school
    finally:
        cur.close()
        _release_conn(conn, pool)


def search_by_major(major_keyword: str, limit: int = 10) -> list:
    conn, pool = _get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT DISTINCT i.id, i.name_kh, i.region, m.name_kh as major_name
            FROM majors m
            JOIN institutions i ON m.institution_id = i.id
            WHERE m.name_kh ILIKE %s
            LIMIT %s
        """, (f'%{major_keyword}%', limit))
        return [{
            "school_id": row[0],
            "school_name": row[1],
            "region": row[2],
            "major": row[3],
        } for row in cur.fetchall()]
    finally:
        cur.close()
        _release_conn(conn, pool)


def search_schools_by_region(region: str, limit: int = 20) -> list:
    conn, pool = _get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, name_kh, type
            FROM institutions
            WHERE region ILIKE %s
            ORDER BY id
            LIMIT %s
        """, (f'%{region}%', limit))
        return [{
            "id": row[0],
            "name": row[1],
            "type": row[2],
        } for row in cur.fetchall()]
    finally:
        cur.close()
        _release_conn(conn, pool)


def search_scholarships(limit: int = 10) -> list:
    conn, pool = _get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT s.id, s.scholarship_name, s.academic_year,
                   s.total_scholarships, i.name_kh as school_name,
                   s.coverage_percentage
            FROM scholarships s
            LEFT JOIN institutions i ON s.institution_id = i.id
            ORDER BY s.total_scholarships DESC NULLS LAST
            LIMIT %s
        """, (limit,))
        return [{
            "scholarship_name": row[1],
            "name": row[1],
            "year": row[2],
            "total_slots": row[3],
            "institution_name": row[4],
            "school": row[4],
            "coverage_percentage": row[5],
        } for row in cur.fetchall()]
    finally:
        cur.close()
        _release_conn(conn, pool)


def get_database_stats() -> dict:
    conn, pool = _get_conn()
    cur = conn.cursor()
    try:
        stats = {}
        cur.execute("SELECT COUNT(*) FROM institutions")
        stats["total_schools"] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM departments")
        stats["total_departments"] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM majors")
        stats["total_majors"] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM scholarships")
        stats["total_scholarships"] = cur.fetchone()[0]
        cur.execute("SELECT DISTINCT region FROM institutions ORDER BY region")
        stats["regions"] = [row[0] for row in cur.fetchall() if row[0]]
        return stats
    finally:
        cur.close()
        _release_conn(conn, pool)


def smart_search(query: str, focused_school_id: int = None) -> dict:
    """
    Smart search — extracts keywords and searches DB accordingly.
    Optional: focused_school_id forces context to be about that specific school.
    """
    results = {
        "query": query,
        "schools_by_name": [],
        "schools_by_major": [],
        "schools_by_region": [],
        "scholarships": [],
        "stats": None,
        "found_schools": [],
    }
    
    # If focused on a specific school (e.g., user on school detail page)
    if focused_school_id:
        full = get_school_full_info(focused_school_id)
        if full:
            results["found_schools"].append(full)
            print(f"[Retriever] Focused on school #{focused_school_id}: {full['name']}")
    
    # Extract keywords
    keywords = extract_keywords(query)
    print(f"[Retriever] Extracted: {keywords}")
    
    # Track found school IDs to avoid duplicates
    seen_school_ids = {s['id'] for s in results['found_schools']}
    
    # Search by each school name keyword (auto-expanded via alias)
    for school_kw in keywords['school_names']:
        schools = search_schools_by_keyword(school_kw, limit=3)
        for s in schools:
            if s not in results["schools_by_name"]:
                results["schools_by_name"].append(s)
                # Get FULL info for matched schools
                if s["id"] not in seen_school_ids:
                    full = get_school_full_info(s["id"])
                    if full:
                        results["found_schools"].append(full)
                        seen_school_ids.add(s["id"])
    
    # Search by region
    for region in keywords['regions']:
        schools = search_schools_by_region(region, limit=10)
        results["schools_by_region"].extend(schools)
    
    # Search by major
    for major in keywords['majors']:
        majors_found = search_by_major(major, limit=8)
        results["schools_by_major"].extend(majors_found)
    
    # Stats — include if user asks OR if no specific search yielded results
    if keywords['asks_stats'] or not any([
        keywords['school_names'], keywords['regions'], keywords['majors'], focused_school_id
    ]):
        results["stats"] = get_database_stats()
    
    # Scholarship info
    if keywords['asks_scholarship']:
        results["scholarships"] = search_scholarships(limit=10)
    
    print(f"[Retriever] Found: {len(results['schools_by_name'])} schools by name, "
          f"{len(results['schools_by_region'])} by region, "
          f"{len(results['schools_by_major'])} by major, "
          f"{len(results['found_schools'])} full school records")
    
    return results