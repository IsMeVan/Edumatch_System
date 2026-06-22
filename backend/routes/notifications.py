"""
Notification system - admin sends messages to users.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from auth.jwt_handler import get_current_user
from auth.admin_check import require_admin
from db.database import get_pool

router = APIRouter(prefix='/notifications', tags=['Notifications'])


class NotificationCreate(BaseModel):
    user_id: int
    title: Optional[str] = None
    message: str
    type: Optional[str] = 'info'  # 'info', 'success', 'warning', 'reply'
    related_report_id: Optional[int] = None


class BroadcastCreate(BaseModel):
    title: Optional[str] = None
    message: str
    type: Optional[str] = 'info'


# USER ENDPOINTS

@router.get('/my-notifications')
def list_my_notifications(current_user: dict = Depends(get_current_user)):
    """Get current user's notifications."""
    user_id = current_user['id']
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT 
                n.id, n.title, n.message, n.type, n.is_read, 
                n.created_at, n.read_at, n.related_report_id,
                u.name as from_admin_name
            FROM notifications n
            LEFT JOIN users u ON u.id = n.from_admin_id
            WHERE n.user_id = %s
            ORDER BY n.created_at DESC
            LIMIT 100
        """, (user_id,))
        
        notifications = [
            {
                'id': r[0],
                'title': r[1],
                'message': r[2],
                'type': r[3],
                'is_read': r[4],
                'created_at': r[5].isoformat() if r[5] else None,
                'read_at': r[6].isoformat() if r[6] else None,
                'related_report_id': r[7],
                'from_admin_name': r[8],
            }
            for r in cur.fetchall()
        ]
        
        # Get unread count
        cur.execute("""
            SELECT COUNT(*) FROM notifications 
            WHERE user_id = %s AND is_read = FALSE
        """, (user_id,))
        unread_count = cur.fetchone()[0]
        
        cur.close()
        return {
            'notifications': notifications,
            'unread_count': unread_count,
        }
    finally:
        pool.putconn(conn)


@router.get('/unread-count')
def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Quick endpoint for badge count."""
    user_id = current_user['id']
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT COUNT(*) FROM notifications 
            WHERE user_id = %s AND is_read = FALSE
        """, (user_id,))
        count = cur.fetchone()[0]
        cur.close()
        return {'unread_count': count}
    finally:
        pool.putconn(conn)


@router.patch('/{notification_id}/read')
def mark_as_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read."""
    user_id = current_user['id']
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE notifications 
            SET is_read = TRUE, read_at = NOW()
            WHERE id = %s AND user_id = %s
        """, (notification_id, user_id))
        conn.commit()
        return {'marked_read': True}
    finally:
        pool.putconn(conn)


@router.patch('/mark-all-read')
def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read."""
    user_id = current_user['id']
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE notifications 
            SET is_read = TRUE, read_at = NOW()
            WHERE user_id = %s AND is_read = FALSE
        """, (user_id,))
        conn.commit()
        return {'marked_read': True}
    finally:
        pool.putconn(conn)


@router.delete('/{notification_id}')
def delete_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    """User deletes their own notification."""
    user_id = current_user['id']
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("""
            DELETE FROM notifications 
            WHERE id = %s AND user_id = %s
        """, (notification_id, user_id))
        conn.commit()
        return {'deleted': True}
    finally:
        pool.putconn(conn)


# ADMIN ENDPOINTS

@router.post('/admin/send')
def admin_send_notification(
    data: NotificationCreate,
    admin=Depends(require_admin)
):
    """Admin sends a notification to a specific user."""
    admin_id = admin.get('id') if isinstance(admin, dict) else admin.id
    
    if not data.message.strip():
        raise HTTPException(400, "Message cannot be empty")
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        # Verify user exists
        cur.execute("SELECT id FROM users WHERE id = %s", (data.user_id,))
        if not cur.fetchone():
            raise HTTPException(404, "User not found")
        
        cur.execute("""
            INSERT INTO notifications 
            (user_id, from_admin_id, title, message, type, related_report_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            data.user_id, admin_id, data.title, 
            data.message.strip(), data.type, data.related_report_id
        ))
        
        row = cur.fetchone()
        conn.commit()
        return {
            'id': row[0],
            'sent': True,
            'created_at': row[1].isoformat() if row[1] else None,
        }
    finally:
        pool.putconn(conn)


@router.post('/admin/broadcast')
def admin_broadcast(
    data: BroadcastCreate,
    admin=Depends(require_admin)
):
    """Admin sends notification to ALL users."""
    admin_id = admin.get('id') if isinstance(admin, dict) else admin.id
    
    if not data.message.strip():
        raise HTTPException(400, "Message cannot be empty")
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        
        # Get all non-admin users
        cur.execute("SELECT id FROM users WHERE is_admin = FALSE OR is_admin IS NULL")
        user_ids = [r[0] for r in cur.fetchall()]
        
        # Insert notification for each user
        for uid in user_ids:
            cur.execute("""
                INSERT INTO notifications 
                (user_id, from_admin_id, title, message, type)
                VALUES (%s, %s, %s, %s, %s)
            """, (uid, admin_id, data.title, data.message.strip(), data.type))
        
        conn.commit()
        return {
            'sent_to': len(user_ids),
            'broadcast': True,
        }
    finally:
        pool.putconn(conn)
        