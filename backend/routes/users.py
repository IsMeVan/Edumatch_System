import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from fastapi.responses import FileResponse
from auth.jwt_handler import get_current_user
from db.database import get_db

router = APIRouter()

UPLOAD_DIR = "uploads/avatars"
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


@router.get("/me")
def get_my_profile(user=Depends(get_current_user), conn=Depends(get_db)):
    """Get the logged-in user's full profile."""
    cur = conn.cursor()
    cur.execute("""
        SELECT id, name, email, role, bio, avatar_url, created_at, is_admin
        FROM users
        WHERE id = %s
    """, (user["id"],))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": row[0],
        "name": row[1],
        "email": row[2],
        "role": row[3],
        "bio": row[4],
        "avatar_url": row[5],
        "created_at": row[6].isoformat() if row[6] else None,
        "is_admin": row[7] if row[7] is not None else False,
    }


@router.put("/me")
def update_my_profile(
    body: dict = Body(...),
    user=Depends(get_current_user),
    conn=Depends(get_db)
):
    """Update name and/or bio."""
    cur = conn.cursor()
    name = body.get("name")
    bio = body.get("bio")

    cur.execute("""
        UPDATE users
        SET name = COALESCE(%s, name),
            bio  = COALESCE(%s, bio)
        WHERE id = %s
        RETURNING id, name, email, role, bio, avatar_url, is_admin
    """, (name, bio, user["id"]))
    row = cur.fetchone()
    conn.commit()

    return {
        "id": row[0], "name": row[1], "email": row[2],
        "role": row[3], "bio": row[4], "avatar_url": row[5],
        "is_admin": row[6] if row[6] is not None else False,
    }


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    conn=Depends(get_db),
):
    """Upload a new avatar image."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type. Use PNG/JPG/JPEG/WEBP")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{user['id']}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    avatar_url = f"/users/avatar/{filename}"

    cur = conn.cursor()
    cur.execute("""
        UPDATE users
        SET avatar_url = %s
        WHERE id = %s
        RETURNING avatar_url
    """, (avatar_url, user["id"]))
    conn.commit()

    return {"avatar_url": avatar_url}


@router.get("/avatar/{filename}")
def get_avatar(filename: str):
    """Serve avatar image file."""
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Avatar not found")
    return FileResponse(filepath)


# Favorites

@router.get("/me/favorites")
def list_favorites(user=Depends(get_current_user), conn=Depends(get_db)):
    """List all favorite schools."""
    cur = conn.cursor()
    cur.execute("""
        SELECT i.id, i.name_kh, i.type, i.region,
               COUNT(DISTINCT s.id) AS scholarships,
               f.created_at
        FROM favorites f
        JOIN institutions i ON f.institution_id = i.id
        LEFT JOIN scholarships s ON s.institution_id = i.id
        WHERE f.user_id = %s
        GROUP BY i.id, f.created_at
        ORDER BY f.created_at DESC
    """, (user["id"],))

    return {
        "favorites": [
            {
                "id": r[0],
                "name": r[1],
                "type": r[2],
                "region": r[3],
                "scholarships": r[4],
                "favorited_at": r[5].isoformat() if r[5] else None,
            }
            for r in cur.fetchall()
        ]
    }


@router.post("/me/favorites/{school_id}")
def add_favorite(school_id: int, user=Depends(get_current_user), conn=Depends(get_db)):
    """Mark a school as favorite."""
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO favorites (user_id, institution_id)
        VALUES (%s, %s)
        ON CONFLICT (user_id, institution_id) DO NOTHING
    """, (user["id"], school_id))
    conn.commit()
    return {"ok": True, "favorited": True}


@router.delete("/me/favorites/{school_id}")
def remove_favorite(school_id: int, user=Depends(get_current_user), conn=Depends(get_db)):
    """Remove a school from favorites."""
    cur = conn.cursor()
    cur.execute("""
        DELETE FROM favorites
        WHERE user_id = %s AND institution_id = %s
    """, (user["id"], school_id))
    conn.commit()
    return {"ok": True, "favorited": False}


@router.get("/me/favorites/check/{school_id}")
def check_favorite(school_id: int, user=Depends(get_current_user), conn=Depends(get_db)):
    """Check if a school is favorited."""
    cur = conn.cursor()
    cur.execute("""
        SELECT 1 FROM favorites
        WHERE user_id = %s AND institution_id = %s
    """, (user["id"], school_id))
    return {"favorited": cur.fetchone() is not None}