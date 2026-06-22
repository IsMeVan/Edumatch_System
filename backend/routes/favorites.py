"""
Favorites endpoints — users can favorite/unfavorite schools.
Also exposes popularity counts for the recommendation system.
"""
from fastapi import APIRouter, Depends, HTTPException
from db.database import get_db
from auth.jwt_handler import get_current_user

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post("/{school_id}")
def add_favorite(
    school_id: int,
    conn=Depends(get_db),
    user=Depends(get_current_user)
):
    """Favorite a school. Returns the new favorite count for that school."""
    cur = conn.cursor()
    
    # Verify school exists
    cur.execute("SELECT id FROM institutions WHERE id = %s", (school_id,))
    if not cur.fetchone():
        raise HTTPException(status_code=404, detail="School not found")
    
    # Insert (ignore if already exists due to UNIQUE constraint)
    try:
        cur.execute("""
            INSERT INTO user_favorites (user_id, institution_id)
            VALUES (%s, %s)
            ON CONFLICT (user_id, institution_id) DO NOTHING
        """, (user["id"], school_id))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # Get new count
    cur.execute("""
        SELECT COUNT(*) FROM user_favorites WHERE institution_id = %s
    """, (school_id,))
    count = cur.fetchone()[0]
    
    return {
        "status": "favorited",
        "school_id": school_id,
        "favorite_count": count,
    }


@router.delete("/{school_id}")
def remove_favorite(
    school_id: int,
    conn=Depends(get_db),
    user=Depends(get_current_user)
):
    """Unfavorite a school. Returns the new favorite count."""
    cur = conn.cursor()
    
    cur.execute("""
        DELETE FROM user_favorites 
        WHERE user_id = %s AND institution_id = %s
    """, (user["id"], school_id))
    
    # Get new count
    cur.execute("""
        SELECT COUNT(*) FROM user_favorites WHERE institution_id = %s
    """, (school_id,))
    count = cur.fetchone()[0]
    
    return {
        "status": "unfavorited",
        "school_id": school_id,
        "favorite_count": count,
    }


@router.get("/")
def list_my_favorites(
    conn=Depends(get_db),
    user=Depends(get_current_user)
):
    """Get all schools the current user has favorited."""
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            i.id, i.name_kh, i.type, i.region, i.address,
            f.created_at,
            (SELECT COUNT(*) FROM user_favorites WHERE institution_id = i.id) as total_favorites,
            (SELECT COUNT(*) FROM departments WHERE institution_id = i.id) as department_count,
            (SELECT COUNT(*) FROM majors WHERE institution_id = i.id) as major_count
        FROM user_favorites f
        JOIN institutions i ON i.id = f.institution_id
        WHERE f.user_id = %s
        ORDER BY f.created_at DESC
    """, (user["id"],))
    
    rows = cur.fetchall()
    favorites = []
    for row in rows:
        favorites.append({
            "id": row[0],
            "name": row[1],
            "type": row[2],
            "region": row[3],
            "address": row[4],
            "favorited_at": row[5].isoformat() if row[5] else None,
            "total_favorites": row[6],
            "departments": row[7],
            "majors": row[8],
        })
    
    return {
        "total": len(favorites),
        "favorites": favorites,
    }


@router.get("/check/{school_id}")
def check_favorite(
    school_id: int,
    conn=Depends(get_db),
    user=Depends(get_current_user)
):
    """Check if user has favorited this school + total count."""
    cur = conn.cursor()
    
    # Is favorited by current user?
    cur.execute("""
        SELECT id FROM user_favorites
        WHERE user_id = %s AND institution_id = %s
    """, (user["id"], school_id))
    is_favorited = cur.fetchone() is not None
    
    # Total favorites for this school
    cur.execute("""
        SELECT COUNT(*) FROM user_favorites WHERE institution_id = %s
    """, (school_id,))
    total = cur.fetchone()[0]
    
    return {
        "school_id": school_id,
        "is_favorited": is_favorited,
        "favorite_count": total,
    }


@router.get("/popular")
def get_popular_schools(
    limit: int = 20,
    conn=Depends(get_db)
):
    """Get schools sorted by favorite count. PUBLIC endpoint (no auth)."""
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            i.id, i.name_kh, i.type, i.region,
            COUNT(f.id) as favorite_count
        FROM institutions i
        LEFT JOIN user_favorites f ON f.institution_id = i.id
        GROUP BY i.id, i.name_kh, i.type, i.region
        ORDER BY favorite_count DESC, i.id
        LIMIT %s
    """, (limit,))
    
    schools = []
    for row in cur.fetchall():
        schools.append({
            "id": row[0],
            "name": row[1],
            "type": row[2],
            "region": row[3],
            "favorite_count": row[4],
        })
    
    return {"popular_schools": schools}


@router.get("/popularity-map")
def get_popularity_map(conn=Depends(get_db)):
    """Internal endpoint — returns popularity for ALL schools (for recommendation)."""
    cur = conn.cursor()
    
    cur.execute("""
        SELECT institution_id, COUNT(*) as count
        FROM user_favorites
        GROUP BY institution_id
    """)
    
    popularity = {row[0]: row[1] for row in cur.fetchall()}
    return {"popularity": popularity}