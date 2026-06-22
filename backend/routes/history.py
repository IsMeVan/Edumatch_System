from fastapi import APIRouter, Depends, HTTPException
from db.database import get_db
from auth.jwt_handler import get_current_user

router = APIRouter()


@router.get("/")
def get_history(conn=Depends(get_db), user=Depends(get_current_user)):
    """Get all surveys submitted by the current user with recommendation counts."""
    cur = conn.cursor()
    cur.execute("""
        SELECT
            s.id,
            s.study_track,
            s.gpa_level,
            s.career_interest,
            s.strong_subjects,
            s.free_text,
            s.submitted_at,
            COUNT(r.id) AS recommendation_count
        FROM survey_responses s
        LEFT JOIN recommendations r ON r.survey_id = s.id
        WHERE s.user_id = %s
        GROUP BY s.id
        ORDER BY s.submitted_at DESC
    """, (user["id"],))

    rows = cur.fetchall()
    return [
        {
            "survey_id": r[0],
            "study_track": r[1],
            "gpa_level": r[2],
            "career_interest": r[3],
            "strong_subjects": r[4],
            "free_text": r[5],
            "submitted_at": r[6].isoformat(),
            "recommendation_count": r[7]
        }
        for r in rows
    ]


@router.get("/{survey_id}/recommendations")
def get_history_recommendations(
    survey_id: int,
    conn=Depends(get_db),
    user=Depends(get_current_user)
):
    """Get the saved recommendations for a specific past survey."""
    cur = conn.cursor()

    # Verify the survey belongs to this user
    cur.execute(
        "SELECT id FROM survey_responses WHERE id = %s AND user_id = %s",
        (survey_id, user["id"])
    )
    if not cur.fetchone():
        raise HTTPException(status_code=404, detail="Survey not found")

    # Get recommendations with full details
    cur.execute("""
        SELECT
            r.rank,
            i.name_kh   AS institution_name,
            i.type      AS institution_type,
            i.region,
            i.address,
            m.name_kh   AS major_name,
            d.name_kh   AS department_name,
            s.scholarship_name,
            s.coverage_percentage,
            s.category  AS scholarship_category
        FROM recommendations r
        JOIN institutions i ON i.id = r.institution_id
        LEFT JOIN majors m ON m.id = r.major_id
        LEFT JOIN departments d ON d.id = m.department_id
        LEFT JOIN scholarships s ON s.id = r.scholarship_id
        WHERE r.survey_id = %s
        ORDER BY r.rank
    """, (survey_id,))

    rows = cur.fetchall()
    return [
        {
            "rank": r[0],
            "institution": {
                "name": r[1],
                "type": r[2],
                "region": r[3],
                "address": r[4]
            },
            "major": r[5],
            "department": r[6],
            "scholarship": {
                "name": r[7],
                "coverage_percentage": r[8],
                "category": r[9]
            } if r[7] else None
        }
        for r in rows
    ]


@router.delete("/{survey_id}")
def delete_survey(
    survey_id: int,
    conn=Depends(get_db),
    user=Depends(get_current_user)
):
    """Delete a survey and all its recommendations."""
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM survey_responses WHERE id = %s AND user_id = %s RETURNING id",
        (survey_id, user["id"])
    )
    deleted = cur.fetchone()
    if not deleted:
        raise HTTPException(status_code=404, detail="Survey not found")
    return {"message": "Survey deleted", "survey_id": survey_id}