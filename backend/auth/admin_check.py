"""
Admin authorization helper.
Use require_admin as FastAPI dependency to protect admin routes.
"""
from fastapi import HTTPException, Depends
from auth.jwt_handler import get_current_user
from db.database import get_pool


def is_admin_user(user_id: int) -> bool:
    """Check if a user has admin privileges."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT is_admin FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        cur.close()
        return row is not None and row[0] is True
    finally:
        pool.putconn(conn)


def require_admin(current_user: dict = Depends(get_current_user)):
    """
    FastAPI dependency that ensures the current user is an admin.
    Raises 403 if not.
    """
    user_id = current_user.get('id') if isinstance(current_user, dict) else current_user.id
    
    if not is_admin_user(user_id):
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    
    return current_user