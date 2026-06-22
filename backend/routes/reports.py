"""
User reports / bug reports / feedback system.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth.jwt_handler import get_current_user
from auth.admin_check import require_admin
from db.database import get_pool

router = APIRouter(prefix='/reports', tags=['Reports'])


class ReportCreate(BaseModel):
    type: str  # 'bug', 'feedback', 'missing_data', 'other'
    subject: Optional[str] = None
    message: str
    page_url: Optional[str] = None


class ReportReply(BaseModel):
    admin_reply: str


class ReportStatusUpdate(BaseModel):
    status: str  # 'new', 'in_progress', 'resolved', 'dismissed'


# USER ENDPOINTS

@router.post('')
def create_report(
    data: ReportCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit a new bug report or feedback (max 5 per day per user)."""
    user_id = current_user['id']
    
    if not data.message.strip():
        raise HTTPException(400, "Message cannot be empty")
    
    if data.type not in ['bug', 'feedback', 'missing_data', 'other']:
        raise HTTPException(400, "Invalid type")
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        # Check daily limit (max 5 reports in last 24 hours)
        cur.execute("""
            SELECT COUNT(*) FROM user_reports 
            WHERE user_id = %s 
            AND created_at >= NOW() - INTERVAL '24 hours'
        """, (user_id,))
        recent_count = cur.fetchone()[0]
        
        if recent_count >= 5:
            raise HTTPException(
                status_code=429,
                detail="You have reached the daily limit of 5 reports. Please try again tomorrow."
            )
        
        cur.execute("""
            INSERT INTO user_reports (user_id, type, subject, message, page_url)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (user_id, data.type, data.subject, data.message.strip(), data.page_url))
        
        row = cur.fetchone()
        conn.commit()
        
        return {
            'id': row[0],
            'created_at': row[1].isoformat() if row[1] else None,
            'submitted': True,
            'remaining_today': 5 - (recent_count + 1),
        }
    finally:
        pool.putconn(conn)


@router.get('/my-reports')
def list_my_reports(current_user: dict = Depends(get_current_user)):
    """Get the current user's reports."""
    user_id = current_user['id']
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, type, subject, message, status, admin_reply, created_at, resolved_at
            FROM user_reports
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
        
        reports = [
            {
                'id': r[0],
                'type': r[1],
                'subject': r[2],
                'message': r[3],
                'status': r[4],
                'admin_reply': r[5],
                'created_at': r[6].isoformat() if r[6] else None,
                'resolved_at': r[7].isoformat() if r[7] else None,
            }
            for r in cur.fetchall()
        ]
        cur.close()
        return {'reports': reports}
    finally:
        pool.putconn(conn)


# ADMIN ENDPOINTS

@router.get('/admin/all')
def admin_list_all_reports(
    admin=Depends(require_admin),
    status: Optional[str] = None,
    type: Optional[str] = None,
):
    """Admin: list all reports with optional filters."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        conditions = []
        params = []
        
        if status:
            conditions.append("r.status = %s")
            params.append(status)
        
        if type:
            conditions.append("r.type = %s")
            params.append(type)
        
        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        cur.execute(f"""
            SELECT 
                r.id, r.type, r.subject, r.message, r.status, r.admin_reply,
                r.page_url, r.created_at, r.resolved_at,
                u.id, u.name, u.email
            FROM user_reports r
            LEFT JOIN users u ON u.id = r.user_id
            {where}
            ORDER BY 
                CASE r.status 
                    WHEN 'new' THEN 0 
                    WHEN 'in_progress' THEN 1 
                    WHEN 'resolved' THEN 2 
                    WHEN 'dismissed' THEN 3 
                END,
                r.created_at DESC
        """, params)
        
        reports = [
            {
                'id': r[0],
                'type': r[1],
                'subject': r[2],
                'message': r[3],
                'status': r[4],
                'admin_reply': r[5],
                'page_url': r[6],
                'created_at': r[7].isoformat() if r[7] else None,
                'resolved_at': r[8].isoformat() if r[8] else None,
                'user': {
                    'id': r[9],
                    'name': r[10],
                    'email': r[11],
                } if r[9] else None,
            }
            for r in cur.fetchall()
        ]
        
        # Get counts by status
        cur.execute("""
            SELECT status, COUNT(*) FROM user_reports GROUP BY status
        """)
        counts = {r[0]: r[1] for r in cur.fetchall()}
        
        cur.close()
        return {
            'reports': reports,
            'counts': {
                'new': counts.get('new', 0),
                'in_progress': counts.get('in_progress', 0),
                'resolved': counts.get('resolved', 0),
                'dismissed': counts.get('dismissed', 0),
                'total': sum(counts.values()),
            }
        }
    finally:
        pool.putconn(conn)


@router.patch('/admin/{report_id}/status')
def admin_update_status(
    report_id: int,
    data: ReportStatusUpdate,
    admin=Depends(require_admin)
):
    """Admin: change report status."""
    if data.status not in ['new', 'in_progress', 'resolved', 'dismissed']:
        raise HTTPException(400, "Invalid status")
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        if data.status == 'resolved':
            cur.execute("""
                UPDATE user_reports 
                SET status = %s, resolved_at = NOW(), updated_at = NOW()
                WHERE id = %s
            """, (data.status, report_id))
        else:
            cur.execute("""
                UPDATE user_reports 
                SET status = %s, updated_at = NOW()
                WHERE id = %s
            """, (data.status, report_id))
        
        conn.commit()
        return {'updated': True, 'status': data.status}
    finally:
        pool.putconn(conn)


@router.patch('/admin/{report_id}/reply')
def admin_reply(
    report_id: int,
    data: ReportReply,
    admin=Depends(require_admin)
):
    """Admin: reply to a user's report (also sends notification)."""
    admin_id = admin.get('id') if isinstance(admin, dict) else admin.id
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        # Update the report with reply
        cur.execute("""
            UPDATE user_reports 
            SET admin_reply = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING user_id, subject
        """, (data.admin_reply, report_id))
        
        result = cur.fetchone()
        if not result:
            raise HTTPException(404, "Report not found")
        
        user_id, report_subject = result
        
        # Send notification to user
        title = f"Reply to your report: {report_subject}" if report_subject else "Reply to your report"
        cur.execute("""
            INSERT INTO notifications 
            (user_id, from_admin_id, title, message, type, related_report_id)
            VALUES (%s, %s, %s, %s, 'reply', %s)
        """, (user_id, admin_id, title, data.admin_reply, report_id))
        
        conn.commit()
        return {'replied': True, 'notification_sent': True}
    finally:
        pool.putconn(conn)


@router.delete('/admin/{report_id}')
def admin_delete_report(report_id: int, admin=Depends(require_admin)):
    """Admin: delete a report."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM user_reports WHERE id = %s", (report_id,))
        conn.commit()
        return {'deleted': True}
    finally:
        pool.putconn(conn)

@router.get('/my-quota')
def get_my_quota(current_user: dict = Depends(get_current_user)):
    """Check how many reports the user can still submit today."""
    user_id = current_user['id']
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT COUNT(*) FROM user_reports 
            WHERE user_id = %s 
            AND created_at >= NOW() - INTERVAL '24 hours'
        """, (user_id,))
        used = cur.fetchone()[0]
        cur.close()
        
        return {
            'used_today': used,
            'limit': 5,
            'remaining': max(0, 5 - used),
        }
    finally:
        pool.putconn(conn)