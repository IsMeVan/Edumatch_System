from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional

from db.database import get_db
from auth.jwt_handler import get_current_user

router = APIRouter()


class SurveyIn(BaseModel):
    study_track: str                    # វិទ្យាសាស្ត្រ or សង្គមវិទ្យា
    gpa_level: str                      # high | medium | low
    career_interest: str                # e.g. ព័ត៌មានវិទ្យា
    strong_subjects: List[str]          # multi-select
    free_text: Optional[str] = None     # optional open text


@router.post("/submit")
def submit_survey(
    body: SurveyIn,
    conn=Depends(get_db),
    user=Depends(get_current_user)
):
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO survey_responses
            (user_id, study_track, gpa_level, career_interest, strong_subjects, free_text)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, submitted_at
    """, (
        user["id"],
        body.study_track,
        body.gpa_level,
        body.career_interest,
        body.strong_subjects,
        body.free_text
    ))
    survey_id, submitted_at = cur.fetchone()

    return {
        "survey_id": survey_id,
        "submitted_at": submitted_at.isoformat(),
        "message": "Survey submitted successfully"
    }


@router.get("/my")
def my_surveys(conn=Depends(get_db), user=Depends(get_current_user)):
    cur = conn.cursor()
    cur.execute("""
        SELECT id, study_track, gpa_level, career_interest, strong_subjects, free_text, submitted_at
        FROM survey_responses
        WHERE user_id = %s
        ORDER BY submitted_at DESC
    """, (user["id"],))

    rows = cur.fetchall()
    return [
        {
            "id": r[0],
            "study_track": r[1],
            "gpa_level": r[2],
            "career_interest": r[3],
            "strong_subjects": r[4],
            "free_text": r[5],
            "submitted_at": r[6].isoformat()
        }
        for r in rows
    ]