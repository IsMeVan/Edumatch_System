from fastapi import APIRouter, Depends, HTTPException
from db.database import get_db

router = APIRouter()


# =========================
# LIST SCHOOLS
# =========================
@router.get("/")
def list_schools(
    conn=Depends(get_db),
    search: str = "",
    region: str = "",
    school_type: str = "",
    has_scholarship: bool = False,
    limit: int = 200,
    offset: int = 0
):
    """List schools with optional search/filter."""

    cur = conn.cursor()

    conditions = []
    params = []

    if search:
        conditions.append("i.name_kh ILIKE %s")
        params.append(f"%{search}%")

    if region:
        conditions.append("i.region = %s")
        params.append(region)

    if school_type:
        conditions.append("i.type = %s")
        params.append(school_type)

    if has_scholarship:
        conditions.append(
            "EXISTS (SELECT 1 FROM scholarships WHERE institution_id = i.id)"
        )

    where_clause = (
        "WHERE " + " AND ".join(conditions)
        if conditions else ""
    )

    # Total count
    cur.execute(
        f"""
        SELECT COUNT(*)
        FROM institutions i
        {where_clause}
        """,
        params
    )

    total = cur.fetchone()[0]

    # Main school list — NOW WITH logo_url AND image_url
    cur.execute(
        f"""
        SELECT
            i.id,
            i.name_kh,
            i.type,
            i.region,
            i.address,
            i.logo_url,
            i.image_url,

            COUNT(DISTINCT d.id) AS dept_count,
            COUNT(DISTINCT m.id) AS major_count,
            COUNT(DISTINCT s.id) AS scholarship_count

        FROM institutions i

        LEFT JOIN departments d
            ON d.institution_id = i.id

        LEFT JOIN majors m
            ON m.institution_id = i.id

        LEFT JOIN scholarships s
            ON s.institution_id = i.id

        {where_clause}

        GROUP BY i.id

        ORDER BY i.name_kh

        LIMIT %s OFFSET %s
        """,
        params + [limit, offset]
    )

    rows = cur.fetchall()

    schools = []

    for r in rows:
        schools.append({
            "id": r[0],
            "name": r[1],
            "type": r[2],
            "region": r[3],
            "address": r[4],
            "logo_url": r[5],
            "image_url": r[6],
            "departments": r[7],
            "majors": r[8],
            "scholarships": r[9],
        })

    # Regions
    cur.execute("""
        SELECT DISTINCT region
        FROM institutions
        WHERE region IS NOT NULL
        ORDER BY region
    """)

    regions = [r[0] for r in cur.fetchall()]

    # Types
    cur.execute("""
        SELECT DISTINCT type
        FROM institutions
        WHERE type IS NOT NULL
        ORDER BY type
    """)

    types = [r[0] for r in cur.fetchall()]

    return {
        "total": total,
        "schools": schools,
        "regions": regions,
        "types": types,
    }


# =========================
# AUTOCOMPLETE SEARCH
# =========================
@router.get("/suggest/")
def suggest_schools(
    q: str = "",
    limit: int = 8,
    conn=Depends(get_db)
):
    """Quick search for autocomplete dropdown."""

    if not q or len(q.strip()) < 1:
        return {"suggestions": []}

    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            id,
            name_kh,
            type,
            region,
            logo_url

        FROM institutions

        WHERE name_kh ILIKE %s

        ORDER BY
            CASE
                WHEN name_kh ILIKE %s THEN 0
                ELSE 1
            END,
            name_kh

        LIMIT %s
        """,
        (
            f"%{q}%",
            f"{q}%",
            limit
        )
    )

    rows = cur.fetchall()

    return {
        "suggestions": [
            {
                "id": r[0],
                "name": r[1],
                "type": r[2],
                "region": r[3],
                "logo_url": r[4],
            }
            for r in rows
        ]
    }


# =========================
# SCHOOL DETAIL
# =========================
@router.get("/{school_id}")
def get_school_detail(
    school_id: int,
    conn=Depends(get_db)
):
    """Get full school detail with scholarships + majors."""

    cur = conn.cursor()

    # 1. School info — NOW WITH logo_url, image_url, phones
    cur.execute(
        """
        SELECT
            id,
            name_kh,
            type,
            region,
            address,
            phones,
            logo_url,
            image_url

        FROM institutions

        WHERE id = %s
        """,
        (school_id,)
    )

    row = cur.fetchone()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="School not found"
        )

    school = {
        "id": row[0],
        "name": row[1],
        "type": row[2],
        "region": row[3],
        "address": row[4],
        "phones": row[5] or [],
        "logo_url": row[6],
        "image_url": row[7],
    }

    # 2. Departments + majors
    cur.execute(
        """
        SELECT
            d.id,
            d.name_kh,
            m.id,
            m.name_kh

        FROM departments d

        LEFT JOIN majors m
            ON m.department_id = d.id

        WHERE d.institution_id = %s

        ORDER BY d.name_kh, m.name_kh
        """,
        (school_id,)
    )

    dept_map = {}

    for r in cur.fetchall():
        dept_id = r[0]
        dept_name = r[1]
        major_id = r[2]
        major_name = r[3]

        if dept_id not in dept_map:
            dept_map[dept_id] = {
                "id": dept_id,
                "name": dept_name,
                "majors": []
            }

        if major_id:
            dept_map[dept_id]["majors"].append({
                "id": major_id,
                "name": major_name
            })

    school["departments"] = list(dept_map.values())

    # 3. Scholarships with quota fields
    cur.execute(
        """
        SELECT
            id,
            scholarship_name,
            academic_year,
            category,
            coverage_percentage,
            total_scholarships,
            eligibility_criteria,
            quota_general,
            quota_female,
            quota_poor,
            quota_remote

        FROM scholarships

        WHERE institution_id = %s

        ORDER BY coverage_percentage DESC NULLS LAST
        """,
        (school_id,)
    )

    scholarship_rows = cur.fetchall()
    scholarships = []

    for r in scholarship_rows:
        scholarship_id = r[0]

        cur2 = conn.cursor()
        cur2.execute(
            """
            SELECT
                major_name_kh,
                total_quota,
                quota_general,
                quota_female,
                quota_poor,
                quota_remote

            FROM scholarship_majors

            WHERE scholarship_id = %s

            ORDER BY total_quota DESC NULLS LAST
            """,
            (scholarship_id,)
        )

        majors = [
            {
                "name": m[0],
                "total_quota": m[1],
                "general": m[2],
                "female": m[3],
                "poor": m[4],
                "remote": m[5],
            }
            for m in cur2.fetchall()
        ]
        cur2.close()

        scholarships.append({
            "id": r[0],
            "name": r[1],
            "academic_year": r[2],
            "category": r[3],
            "coverage_percentage": r[4],
            "total_scholarships": r[5],
            "eligibility_criteria": r[6] or [],
            "quota_general": r[7],
            "quota_female": r[8],
            "quota_poor": r[9],
            "quota_remote": r[10],
            "majors": majors,
        })

    school["scholarships"] = scholarships

    # 4. Totals
    school["total_departments"] = len(school["departments"])
    school["total_majors"] = sum(
        len(d["majors"]) for d in school["departments"]
    )
    school["total_scholarships"] = len(scholarships)

    return school