"""
Admin-only routes.
All routes require admin privileges.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional, List
from pydantic import BaseModel
from auth.admin_check import require_admin
from db.database import get_pool
import shutil
from pathlib import Path
from datetime import datetime

router = APIRouter(prefix='/admin', tags=['Admin'])

# Upload folder paths
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / 'frontend' / 'public' / 'school-logos'
LOGOS_DIR = UPLOAD_DIR / 'logos'
SCHOOLS_DIR = UPLOAD_DIR / 'schools'
LOGOS_DIR.mkdir(parents=True, exist_ok=True)
SCHOOLS_DIR.mkdir(parents=True, exist_ok=True)


# Pydantic schemas
class SchoolCreate(BaseModel):
    name_kh: str
    type: Optional[str] = None
    region: Optional[str] = None
    address: Optional[str] = None
    phones: Optional[List[str]] = []


class SchoolUpdate(BaseModel):
    name_kh: Optional[str] = None
    type: Optional[str] = None
    region: Optional[str] = None
    address: Optional[str] = None
    phones: Optional[List[str]] = None


# Dashboard stats
@router.get('/stats')
def admin_stats(admin=Depends(require_admin)):
    """Get dashboard statistics."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM users")
        total_users = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM users WHERE is_admin = TRUE")
        total_admins = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM institutions")
        total_schools = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM majors")
        total_majors = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(DISTINCT name_kh) FROM majors")
        unique_majors = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM scholarships")
        total_scholarships = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM user_favorites")
        total_favorites = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM chat_conversations")
        total_chats = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM chat_messages")
        total_messages = cur.fetchone()[0]
        
        # User signups in last 30 days
        cur.execute("""
            SELECT 
                TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as day, 
                COUNT(*) as count
            FROM users
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY day
        """)
        signups_chart = [
            {'date': r[0], 'count': r[1]} 
            for r in cur.fetchall()
        ]
        
        # Most favorited schools
        cur.execute("""
            SELECT 
                i.id, i.name_kh, i.logo_url,
                COUNT(uf.id) as favorite_count
            FROM institutions i
            LEFT JOIN user_favorites uf ON uf.institution_id = i.id
            GROUP BY i.id
            HAVING COUNT(uf.id) > 0
            ORDER BY favorite_count DESC
            LIMIT 10
        """)
        top_schools = [
            {
                'id': r[0],
                'name': r[1],
                'logo_url': r[2],
                'favorites': r[3]
            }
            for r in cur.fetchall()
        ]
        
        cur.close()
        
        return {
            'stats': {
                'total_users': total_users,
                'total_admins': total_admins,
                'total_schools': total_schools,
                'total_majors': total_majors,
                'unique_majors': unique_majors,
                'total_scholarships': total_scholarships,
                'total_favorites': total_favorites,
                'total_chats': total_chats,
                'total_messages': total_messages,
            },
            'signups_chart': signups_chart,
            'top_schools': top_schools,
        }
    finally:
        pool.putconn(conn)
@router.get('/chart-data')
def admin_chart_data(admin=Depends(require_admin)):
    """Get data for all admin dashboard charts."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        # 1. User signups in last 30 days (already in stats but keep here)
        cur.execute("""
            SELECT 
                TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as day, 
                COUNT(*) as count
            FROM users
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY day
        """)
        signups = [{'date': r[0], 'count': r[1]} for r in cur.fetchall()]
        
        # 2. Schools by region
        cur.execute("""
            SELECT 
                CASE 
                    WHEN region ILIKE '%ភ្នំពេញ%' OR region ILIKE '%phnom penh%' THEN 'Phnom Penh'
                    ELSE 'Provinces'
                END as region_group,
                COUNT(*) as count
            FROM institutions
            GROUP BY region_group
        """)
        schools_by_region = [{'label': r[0], 'value': r[1]} for r in cur.fetchall()]
        
        # 3. Schools by type
        cur.execute("""
            SELECT 
                CASE 
                    WHEN type ILIKE '%សាធារណៈ%' THEN 'Public'
                    WHEN type ILIKE '%ឯកជន%' THEN 'Private'
                    ELSE 'Other'
                END as type_group,
                COUNT(*) as count
            FROM institutions
            WHERE type IS NOT NULL
            GROUP BY type_group
            ORDER BY count DESC
        """)
        schools_by_type = [{'label': r[0], 'value': r[1]} for r in cur.fetchall()]
        
        # 4. Top 10 favorited schools
        cur.execute("""
            SELECT 
                i.name_kh, 
                COUNT(uf.id) as fav_count
            FROM institutions i
            LEFT JOIN user_favorites uf ON uf.institution_id = i.id
            GROUP BY i.id, i.name_kh
            HAVING COUNT(uf.id) > 0
            ORDER BY fav_count DESC
            LIMIT 10
        """)
        top_favorited = [{'label': r[0], 'value': r[1]} for r in cur.fetchall()]
        
        # 5. Top 10 schools by number of majors
        cur.execute("""
            SELECT 
                i.name_kh,
                COUNT(m.id) as major_count
            FROM institutions i
            LEFT JOIN majors m ON m.institution_id = i.id
            GROUP BY i.id, i.name_kh
            HAVING COUNT(m.id) > 0
            ORDER BY major_count DESC
            LIMIT 10
        """)
        top_by_majors = [{'label': r[0], 'value': r[1]} for r in cur.fetchall()]
        
        # 6. Chat activity (last 30 days)
        cur.execute("""
            SELECT 
                TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as day, 
                COUNT(*) as count
            FROM chat_messages
            WHERE created_at >= NOW() - INTERVAL '30 days'
                AND role = 'user'
            GROUP BY DATE(created_at)
            ORDER BY day
        """)
        chat_activity = [{'date': r[0], 'count': r[1]} for r in cur.fetchall()]
        
        cur.close()
        
        return {
            'signups': signups,
            'schools_by_region': schools_by_region,
            'schools_by_type': schools_by_type,
            'top_favorited': top_favorited,
            'top_by_majors': top_by_majors,
            'chat_activity': chat_activity,
        }
    finally:
        pool.putconn(conn)

# Users management
@router.get('/users')
def list_users(admin=Depends(require_admin)):
    """List all users."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT 
                u.id, u.name, u.email, u.role, u.is_admin, u.created_at,
                (SELECT COUNT(*) FROM user_favorites WHERE user_id = u.id) as fav_count,
                (SELECT COUNT(*) FROM chat_conversations WHERE user_id = u.id) as chat_count
            FROM users u
            ORDER BY u.created_at DESC
        """)
        users = [
            {
                'id': r[0],
                'name': r[1],
                'email': r[2],
                'role': r[3],
                'is_admin': r[4],
                'created_at': r[5].isoformat() if r[5] else None,
                'favorite_count': r[6],
                'chat_count': r[7],
            }
            for r in cur.fetchall()
        ]
        cur.close()
        return {'users': users}
    finally:
        pool.putconn(conn)


@router.post('/users/{user_id}/promote')
def promote_user(user_id: int, admin=Depends(require_admin)):
    """Promote a user to admin."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT name, is_admin FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(404, "User not found")
        if user[1]:
            return {'message': 'Already admin', 'already_admin': True}
        
        cur.execute(
            "UPDATE users SET is_admin = TRUE, role = 'admin' WHERE id = %s", 
            (user_id,)
        )
        conn.commit()
        return {'promoted': True, 'name': user[0]}
    finally:
        pool.putconn(conn)


@router.post('/users/{user_id}/demote')
def demote_user(user_id: int, admin=Depends(require_admin)):
    """Remove admin status from a user."""
    current_admin_id = admin.get('id') if isinstance(admin, dict) else admin.id
    
    if user_id == current_admin_id:
        raise HTTPException(400, "Cannot demote yourself")
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET is_admin = FALSE, role = 'user' WHERE id = %s", 
            (user_id,)
        )
        conn.commit()
        return {'demoted': True}
    finally:
        pool.putconn(conn)


@router.delete('/users/{user_id}')
def delete_user(user_id: int, admin=Depends(require_admin)):
    """Delete a user account."""
    current_admin_id = admin.get('id') if isinstance(admin, dict) else admin.id
    
    if user_id == current_admin_id:
        raise HTTPException(400, "Cannot delete yourself")
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        return {'deleted': True}
    finally:
        pool.putconn(conn)


# School CRUD
@router.post('/schools')
def create_school(data: SchoolCreate, admin=Depends(require_admin)):
    """Create a new school."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO institutions (name_kh, type, region, address, phones)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (data.name_kh, data.type, data.region, data.address, data.phones))
        
        new_id = cur.fetchone()[0]
        conn.commit()
        return {'id': new_id, 'created': True}
    finally:
        pool.putconn(conn)


@router.patch('/schools/{school_id}')
def update_school(school_id: int, data: SchoolUpdate, admin=Depends(require_admin)):
    """Update school information."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        updates = []
        params = []
        for field in ['name_kh', 'type', 'region', 'address', 'phones']:
            val = getattr(data, field, None)
            if val is not None:
                updates.append(f"{field} = %s")
                params.append(val)
        
        if not updates:
            raise HTTPException(400, "No fields to update")
        
        params.append(school_id)
        cur.execute(
            f"UPDATE institutions SET {', '.join(updates)} WHERE id = %s",
            params
        )
        conn.commit()
        return {'updated': True}
    finally:
        pool.putconn(conn)


@router.delete('/schools/{school_id}')
def delete_school(school_id: int, admin=Depends(require_admin)):
    """Delete a school."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM institutions WHERE id = %s", (school_id,))
        conn.commit()
        return {'deleted': True}
    finally:
        pool.putconn(conn)


# Image uploads
@router.post('/schools/{school_id}/upload-logo')
def upload_logo(
    school_id: int,
    file: UploadFile = File(...),
    admin=Depends(require_admin)
):
    """Upload a school logo."""
    if not file.content_type.startswith('image/'):
        raise HTTPException(400, "Must be an image file")
    
    ext = file.filename.split('.')[-1].lower()
    if ext not in ['png', 'jpg', 'jpeg', 'gif', 'webp']:
        raise HTTPException(400, "Unsupported file type")
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"school_{school_id}_{timestamp}.{ext}"
    filepath = LOGOS_DIR / filename
    
    with open(filepath, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    
    logo_url = f"/school-logos/logos/{filename}"
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE institutions SET logo_url = %s WHERE id = %s", 
            (logo_url, school_id)
        )
        conn.commit()
    finally:
        pool.putconn(conn)
    
    return {'logo_url': logo_url, 'uploaded': True}


@router.post('/schools/{school_id}/upload-photo')
def upload_photo(
    school_id: int,
    file: UploadFile = File(...),
    admin=Depends(require_admin)
):
    """Upload a school campus photo."""
    if not file.content_type.startswith('image/'):
        raise HTTPException(400, "Must be an image")
    
    ext = file.filename.split('.')[-1].lower()
    if ext not in ['png', 'jpg', 'jpeg', 'gif', 'webp']:
        raise HTTPException(400, "Unsupported file type")
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"school_{school_id}_{timestamp}.{ext}"
    filepath = SCHOOLS_DIR / filename
    
    with open(filepath, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    
    image_url = f"/school-logos/schools/{filename}"
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE institutions SET image_url = %s WHERE id = %s", 
            (image_url, school_id)
        )
        conn.commit()
    finally:
        pool.putconn(conn)
    
    return {'image_url': image_url, 'uploaded': True}

# ─── DEPARTMENTS MANAGEMENT ───

class DepartmentCreate(BaseModel):
    name_kh: str
    institution_id: int


class DepartmentUpdate(BaseModel):
    name_kh: Optional[str] = None


@router.get('/departments')
def list_departments(
    admin=Depends(require_admin),
    school_id: Optional[int] = None
):
    """List departments, optionally filtered by school."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        if school_id:
            cur.execute("""
                SELECT 
                    d.id, d.name_kh, d.institution_id,
                    i.name_kh as school_name,
                    (SELECT COUNT(*) FROM majors WHERE department_id = d.id) as major_count
                FROM departments d
                LEFT JOIN institutions i ON i.id = d.institution_id
                WHERE d.institution_id = %s
                ORDER BY d.name_kh
            """, (school_id,))
        else:
            cur.execute("""
                SELECT 
                    d.id, d.name_kh, d.institution_id,
                    i.name_kh as school_name,
                    (SELECT COUNT(*) FROM majors WHERE department_id = d.id) as major_count
                FROM departments d
                LEFT JOIN institutions i ON i.id = d.institution_id
                ORDER BY i.name_kh, d.name_kh
            """)
        
        departments = [
            {
                'id': r[0],
                'name_kh': r[1],
                'institution_id': r[2],
                'school_name': r[3],
                'major_count': r[4],
            }
            for r in cur.fetchall()
        ]
        cur.close()
        return {'departments': departments}
    finally:
        pool.putconn(conn)


@router.post('/departments')
def create_department(data: DepartmentCreate, admin=Depends(require_admin)):
    """Create a new department."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO departments (name_kh, institution_id)
            VALUES (%s, %s)
            RETURNING id
        """, (data.name_kh, data.institution_id))
        
        new_id = cur.fetchone()[0]
        conn.commit()
        return {'id': new_id, 'created': True}
    finally:
        pool.putconn(conn)

# ─── MAJORS MANAGEMENT ───

class MajorCreate(BaseModel):
    name_kh: str
    institution_id: int
    department_id: int  # REQUIRED now!


class MajorUpdate(BaseModel):
    name_kh: Optional[str] = None
    department_id: Optional[int] = None


@router.get('/majors')
def list_majors(
    admin=Depends(require_admin),
    school_id: Optional[int] = None,
    department_id: Optional[int] = None,
    search: str = "",
    limit: int = 100,
    offset: int = 0
):
    """List majors with optional filtering."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        conditions = []
        params = []
        
        if school_id:
            conditions.append("m.institution_id = %s")
            params.append(school_id)
        
        if department_id:
            conditions.append("m.department_id = %s")
            params.append(department_id)
        
        if search:
            conditions.append("m.name_kh ILIKE %s")
            params.append(f"%{search}%")
        
        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        cur.execute(f"SELECT COUNT(*) FROM majors m {where}", params)
        total = cur.fetchone()[0]
        
        cur.execute(f"""
            SELECT 
                m.id, m.name_kh, m.institution_id, m.department_id,
                i.name_kh as school_name,
                d.name_kh as department_name
            FROM majors m
            LEFT JOIN institutions i ON i.id = m.institution_id
            LEFT JOIN departments d ON d.id = m.department_id
            {where}
            ORDER BY i.name_kh, d.name_kh, m.name_kh
            LIMIT %s OFFSET %s
        """, params + [limit, offset])
        
        majors = [
            {
                'id': r[0],
                'name_kh': r[1],
                'institution_id': r[2],
                'department_id': r[3],
                'school_name': r[4],
                'department_name': r[5],
            }
            for r in cur.fetchall()
        ]
        cur.close()
        return {'majors': majors, 'total': total}
    finally:
        pool.putconn(conn)


@router.post('/majors')
def create_major(data: MajorCreate, admin=Depends(require_admin)):
    """Create a new major."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        # Verify department belongs to the school
        cur.execute(
            "SELECT institution_id FROM departments WHERE id = %s",
            (data.department_id,)
        )
        dept = cur.fetchone()
        if not dept:
            raise HTTPException(400, "Department not found")
        if dept[0] != data.institution_id:
            raise HTTPException(400, "Department doesn't belong to this school")
        
        cur.execute("""
            INSERT INTO majors (name_kh, institution_id, department_id)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (data.name_kh, data.institution_id, data.department_id))
        
        new_id = cur.fetchone()[0]
        conn.commit()
        return {'id': new_id, 'created': True}
    finally:
        pool.putconn(conn)

@router.patch('/departments/{dept_id}')
def update_department(dept_id: int, data: DepartmentUpdate, admin=Depends(require_admin)):
    """Update department info."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE departments SET name_kh = %s WHERE id = %s",
            (data.name_kh, dept_id)
        )
        conn.commit()
        return {'updated': True}
    finally:
        pool.putconn(conn)


@router.delete('/departments/{dept_id}')
def delete_department(dept_id: int, admin=Depends(require_admin)):
    """Delete a department (cascades to majors)."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM departments WHERE id = %s", (dept_id,))
        conn.commit()
        return {'deleted': True}
    finally:
        pool.putconn(conn)


@router.post('/majors')
def create_major(data: MajorCreate, admin=Depends(require_admin)):
    """Create a new major."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO majors (name_kh, institution_id, department_id)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (data.name_kh, data.institution_id, data.department_id))
        
        new_id = cur.fetchone()[0]
        conn.commit()
        return {'id': new_id, 'created': True}
    finally:
        pool.putconn(conn)


@router.patch('/majors/{major_id}')
def update_major(major_id: int, data: MajorUpdate, admin=Depends(require_admin)):
    """Update major information."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        updates = []
        params = []
        for field in ['name_kh', 'department_id']:
            val = getattr(data, field, None)
            if val is not None:
                updates.append(f"{field} = %s")
                params.append(val)
        
        if not updates:
            raise HTTPException(400, "No fields to update")
        
        params.append(major_id)
        cur.execute(
            f"UPDATE majors SET {', '.join(updates)} WHERE id = %s",
            params
        )
        conn.commit()
        return {'updated': True}
    finally:
        pool.putconn(conn)


@router.delete('/majors/{major_id}')
def delete_major(major_id: int, admin=Depends(require_admin)):
    """Delete a major."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM majors WHERE id = %s", (major_id,))
        conn.commit()
        return {'deleted': True}
    finally:
        pool.putconn(conn)


@router.get('/schools-list')
def list_schools_for_dropdown(admin=Depends(require_admin)):
    """Get simple list of schools for dropdowns."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name_kh FROM institutions ORDER BY name_kh")
        schools = [{'id': r[0], 'name': r[1]} for r in cur.fetchall()]
        cur.close()
        return {'schools': schools}
    finally:
        pool.putconn(conn)