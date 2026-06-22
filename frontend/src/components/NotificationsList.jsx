import { useEffect, useState } from 'react'
import api from '../api'

export default function NotificationsList() {
  const [data, setData] = useState({ notifications: [], unread_count: 0 })
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const loadNotifications = () => {
    setLoading(true)
    api.get('/notifications/my-notifications')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadNotifications() }, [])

  const handleToggle = async (notif) => {
    // If clicking the currently-expanded one, collapse it
    if (expandedId === notif.id) {
      setExpandedId(null)
      return
    }

    // Expand this one
    setExpandedId(notif.id)
    
    // Mark as read if it was unread
    if (!notif.is_read) {
      try {
        await api.patch(`/notifications/${notif.id}/read`)
        
        // LIVE UPDATE: update local state immediately
        setData(prev => ({
          ...prev,
          unread_count: Math.max(0, prev.unread_count - 1),
          notifications: prev.notifications.map(n => 
            n.id === notif.id ? { ...n, is_read: true } : n
          )
        }))
        
        // Notify UserMenu badge to update
        window.dispatchEvent(new Event('notifications-changed'))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read')
      
      // LIVE UPDATE: mark all as read locally
      setData(prev => ({
        ...prev,
        unread_count: 0,
        notifications: prev.notifications.map(n => ({ ...n, is_read: true }))
      }))
      
      // Notify UserMenu badge to update
      window.dispatchEvent(new Event('notifications-changed'))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()  // Prevent toggle when clicking delete
    if (!confirm('Delete this notification?')) return
    try {
      await api.delete(`/notifications/${id}`)
      if (expandedId === id) setExpandedId(null)
      
      // LIVE UPDATE: remove from local state
      const wasUnread = data.notifications.find(n => n.id === id && !n.is_read)
      setData(prev => ({
        ...prev,
        unread_count: wasUnread ? Math.max(0, prev.unread_count - 1) : prev.unread_count,
        notifications: prev.notifications.filter(n => n.id !== id)
      }))
      
      // Notify UserMenu badge to update
      window.dispatchEvent(new Event('notifications-changed'))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {data.unread_count > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {data.unread_count > 9 ? '9+' : data.unread_count}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">សារពីប្រព័ន្ធ</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {data.unread_count > 0 
                ? `មាន ${data.unread_count} សារថ្មី` 
                : 'មិនទាន់មានសារថ្មីទេ'}
            </p>
          </div>
        </div>
        {data.unread_count > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20"
          >
            អានទាំងអស់
          </button>
        )}
      </div>

      {data.notifications.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-sm text-gray-500">មិនទាន់មានសារទេ</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.notifications.map(notif => (
            <NotificationCard 
              key={notif.id} 
              notification={notif}
              isExpanded={expandedId === notif.id}
              onToggle={() => handleToggle(notif)}
              onDelete={(e) => handleDelete(e, notif.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}


function NotificationCard({ notification, isExpanded, onToggle, onDelete }) {
  const date = new Date(notification.created_at).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  const typeLabel = {
    info: 'ព័ត៌មាន',
    success: 'ជោគជ័យ',
    warning: 'ប្រុងប្រយ័ត្ន',
    reply: 'ការឆ្លើយតប',
  }

  const typeBadgeStyles = {
    reply: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  }

  return (
    <div className={`
      w-full border rounded-xl transition-all overflow-hidden
      ${!notification.is_read 
        ? 'border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/10' 
        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}
      ${isExpanded ? 'shadow-md' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
    `}>
      <button
        onClick={onToggle}
        className="w-full p-4 text-left flex items-center gap-3"
      >
        {!notification.is_read && (
          <div className="w-2.5 h-2.5 rounded-full bg-brand-500 flex-shrink-0" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${typeBadgeStyles[notification.type] || typeBadgeStyles.info}`}>
              {typeLabel[notification.type] || 'ព័ត៌មាន'}
            </span>
            <span className="text-xs text-gray-400">{date}</span>
            {!notification.is_read && (
              <span className="text-xs text-brand-600 dark:text-brand-400 font-bold">
                ថ្មី
              </span>
            )}
          </div>
          
          {notification.title ? (
            <h4 className={`font-semibold truncate ${
              !notification.is_read 
                ? 'text-gray-900 dark:text-white' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {notification.title}
            </h4>
          ) : (
            <h4 className="font-semibold text-gray-500 dark:text-gray-400 italic">
              (មិនមានចំណងជើង)
            </h4>
          )}
          
          {!isExpanded && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              ចុចដើម្បីអាន
            </p>
          )}
        </div>

        <svg 
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          <div className="pt-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {notification.message}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            {notification.from_admin_name ? (
              <p className="text-xs text-gray-400">
                ពី: <span className="font-medium">{notification.from_admin_name}</span>
              </p>
            ) : (
              <span />
            )}
            <button
              onClick={onDelete}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              លុប
            </button>
          </div>
        </div>
      )}
    </div>
  )
}