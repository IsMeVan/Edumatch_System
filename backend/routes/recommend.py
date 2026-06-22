"""
Smart recommendation:
- Free text gets heavy weight (embedded separately + blended)
- Khmer embeddings (BGE-M3)
- Diversify: max 1 major per school
- Split: Top 15 Phnom Penh + Top 10 Other regions = 25 total
"""
from fastapi import APIRouter, Depends, HTTPException
import numpy as np
import os

from db.database import get_db
from auth.jwt_handler import get_current_user
from nlp.embedder import embed
from nlp.ner_extractor import build_user_profile, extract_entities
from nlp.cosine_matcher import rank_by_similarity

router = APIRouter()

INDEX_DIR = "nlp_index"
_vectors = None
_ids = None


def load_index():
    global _vectors, _ids
    if _vectors is None:
        _vectors = np.load(os.path.join(INDEX_DIR, "vectors.npy"))
        _ids = np.load(os.path.join(INDEX_DIR, "ids.npy"))
    return _vectors, _ids


def normalize_region(region: str) -> str:
    if not region:
        return ""
    return region.replace("ខេត្ត", "").replace("រាជធានី", "").strip().lower()


def is_phnom_penh(region: str) -> bool:
    if not region:
        return False
    norm = normalize_region(region)
    return "ភ្នំពេញ" in norm or "phnom" in norm.lower()


def build_free_text_profile(free_text: str) -> str:
    """
    Turn free text into a boosted Khmer profile.
    Extracts fields and repeats them heavily so the embedding
    reflects what the student actually said in their own words.
    """
    if not free_text:
        return ""

    parts = [free_text]  # keep original expression

    # extract fields and boost them
    entities = extract_entities(free_text)
    for field in entities:
        # repeat 4x — same heavy weight as career_interest
        parts.append(f"ខ្ញុំចង់សិក្សាផ្នែក{field}")
        parts.append(f"ខ្ញុំចាប់អារម្មណ៍លើ{field}")
        parts.append(f"គោលដៅអាជីពរបស់ខ្ញុំគឺ{field}")
        parts.append(field)

    return " ".join(parts)


@router.get("/{survey_id}")
def get_recommendations(
    survey_id: int,
    conn=Depends(get_db),
    user=Depends(get_current_user)
):
    cur = conn.cursor()

    # ─── 1. Fetch survey ───
    cur.execute("""
        SELECT
            study_track, gpa_level, career_interest, strong_subjects, free_text,
            region_preference
        FROM survey_responses
        WHERE id = %s AND user_id = %s
    """, (survey_id, user["id"]))
    survey = cur.fetchone()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    (study_track, gpa_level, career_interest, strong_subjects, free_text,
     region_preference) = survey

    survey_dict = {
        "study_track": study_track,
        "gpa_level": gpa_level,
        "career_interest": career_interest,
        "strong_subjects": strong_subjects,
        "free_text": free_text,
        "region_preference": region_preference,
    }

    # ─── 2. Build structured profile ───
    profile = build_user_profile(survey_dict)
    profile_text = profile["profile_text"]
    user_region = profile["region"]

    print(f"\n[Recommend] Structured profile:")
    print(f"  - Text: {profile_text[:120]}...")
    print(f"  - Region: {user_region}")
    print(f"  - Interests: {profile['extracted_interests']}")

    # ─── 3. Embed structured profile ───
    struct_vec = embed(profile_text)

    # ─── 4. Free text: embed separately if provided ───
    has_free_text = bool(free_text and free_text.strip())
    if has_free_text:
        free_text_profile = build_free_text_profile(free_text)
        free_text_vec = embed(free_text_profile)
        print(f"  - Free text profile: {free_text_profile[:120]}...")
    
    # ─── 5. Cosine similarity ───
    vectors, ids = load_index()

    struct_scores = rank_by_similarity(struct_vec, vectors)

    if has_free_text:
        free_scores = rank_by_similarity(free_text_vec, vectors)
        # Blend: 40% structured survey + 60% free text expression
        # Free text gets more weight because it's the student's own words
        scores = 0.40 * struct_scores + 0.60 * free_scores
        print(f"  - Score blend: 40% survey + 60% free text")
    else:
        scores = struct_scores
        print(f"  - Score blend: 100% survey (no free text)")

    # ─── 6. Top 500 candidates (more generous pool) ───
    top_indices = np.argsort(scores)[::-1][:500]
    top_major_ids = [int(ids[i]) for i in top_indices]
    embedding_scores = {int(ids[i]): float(scores[i]) for i in top_indices}

    # ─── 7. Fetch full details ───
    cur.execute("""
        SELECT
            m.id, m.name_kh,
            d.id, d.name_kh,
            i.id, i.name_kh, i.type, i.region, i.address
        FROM majors m
        JOIN departments d ON d.id = m.department_id
        JOIN institutions i ON i.id = m.institution_id
        WHERE m.id = ANY(%s)
    """, (top_major_ids,))
    rows = {r[0]: r for r in cur.fetchall()}

    # ─── 8. Score with region bonus ───
    all_scored = []
    for mid in top_major_ids:
        if mid not in rows:
            continue
        row = rows[mid]
        major_id, major_name, dept_id, dept_name, inst_id, inst_name, inst_type, region, address = row

        embedding_score = embedding_scores[mid]

        region_bonus = 0.0
        if user_region:
            user_norm = normalize_region(user_region)
            school_norm = normalize_region(region or "")
            if user_norm and school_norm and user_norm == school_norm:
                region_bonus = 0.05

        final_score = 0.95 * max(0, embedding_score) + region_bonus

        all_scored.append({
            "mid": mid,
            "row": row,
            "embedding_score": embedding_score,
            "region_bonus": region_bonus,
            "final_score": final_score,
            "is_pp": is_phnom_penh(region),
            "inst_id": inst_id,
        })

    all_scored.sort(key=lambda x: x["final_score"], reverse=True)

    # ─── 9. SPLIT: Top 20 Phnom Penh + Top 20 Other regions ─── 
    pp_results = [s for s in all_scored if s["is_pp"]]
    other_results = [s for s in all_scored if not s["is_pp"]]

    def diversify(results, max_per_school=1, limit=20):
        schools_seen = {}
        diversified = []
        for s in results:
            count = schools_seen.get(s["inst_id"], 0)
            if count < max_per_school:
                diversified.append(s)
                schools_seen[s["inst_id"]] = count + 1
            if len(diversified) >= limit:
                break
        return diversified

    top_pp = diversify(pp_results, max_per_school=1, limit=20)
    top_other = diversify(other_results, max_per_school=1, limit=20)
    final_list = top_pp + top_other

    print(f"\n[Recommend] Final split:")
    print(f"  - Phnom Penh: {len(top_pp)}")
    print(f"  - Other regions: {len(top_other)}")
    print(f"  - Total: {len(final_list)}")

    # ─── 10. Build response ───
    results = []
    for sr in final_list:
        row = sr["row"]
        mid, major_name, dept_id, dept_name, inst_id, inst_name, inst_type, region, address = row

        cur.execute("""
            SELECT s.id, s.scholarship_name, s.coverage_percentage, s.category
            FROM scholarships s
            WHERE s.institution_id = %s
            LIMIT 1
        """, (inst_id,))
        sch = cur.fetchone()

        scholarship = None
        if sch:
            scholarship = {
                "scholarship_id": sch[0],
                "name": sch[1],
                "coverage_percentage": sch[2],
                "category": sch[3],
            }

        results.append({
            "institution": {
                "id": inst_id,
                "name": inst_name,
                "type": inst_type,
                "region": region,
                "address": address,
            },
            "department": dept_name,
            "major": {"id": mid, "name": major_name},
            "scholarship": scholarship,
            "similarity_score": round(sr["final_score"], 4),
            "is_phnom_penh": sr["is_pp"],
            "region_match": bool(
                user_region and
                normalize_region(user_region) == normalize_region(region or "")
            ),
            "free_text_used": has_free_text,
        })

    # ─── 11. Save top 20 ───
    cur.execute("DELETE FROM recommendations WHERE survey_id = %s", (survey_id,))
    for rank, r in enumerate(results[:20], start=1):
        cur.execute("""
            INSERT INTO recommendations
                (survey_id, user_id, institution_id, major_id, scholarship_id, cosine_score, rank)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            survey_id, user["id"],
            r["institution"]["id"], r["major"]["id"],
            r["scholarship"]["scholarship_id"] if r["scholarship"] else None,
            r["similarity_score"],
            rank,
        ))
    conn.commit()

    return {
        "survey_id": survey_id,
        "career_interest": career_interest,
        "profile_used": profile_text,
        "free_text": free_text,
        "detected_region": user_region,
        "total_matches": len(results),
        "results": results,
    }