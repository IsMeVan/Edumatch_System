import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const API_BASE = 'http://localhost:8000'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef(null)

  const avatarUrl = user?.avatar_url

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return

    const fetchUnread = () => {
      api.get('/notifications/unread-count')
        .then(res => setUnreadCount(res.data.unread_count || 0))
        .catch(() => { })
    }

    fetchUnread()

    // Refresh every 30 seconds in case admin sent new notification
    const interval = setInterval(fetchUnread, 30000)

    // LIVE UPDATE: listen for notification changes from Profile page
    const handleNotificationChange = () => {
      fetchUnread()
    }
    window.addEventListener('notifications-changed', handleNotificationChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('notifications-changed', handleNotificationChange)
    }
  }, [user])
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/')
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="
          flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full
          bg-gray-100 hover:bg-gray-200
          dark:bg-gray-800 dark:hover:bg-gray-700
          transition-colors
          relative
        "
      >
        <div className="relative">
          <div className="
            w-8 h-8 rounded-full overflow-hidden flex items-center justify-center
            bg-gradient-to-br from-brand-500 to-purple-500
            text-white text-sm font-bold
          ">
            {avatarUrl ? (
              <img src={`${API_BASE}${avatarUrl}`} alt="" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          {/* Notification badge */}
          {unreadCount > 0 && (
            <span className="
              absolute -top-1 -right-1 
              min-w-[18px] h-[18px] px-1
              bg-red-500 text-white text-[10px] font-bold rounded-full 
              flex items-center justify-center
              border-2 border-white dark:border-gray-800
              pointer-events-none
              animate-pulse
            ">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
          {user?.name}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="
          absolute right-0 mt-2 w-64 origin-top-right
          bg-white dark:bg-gray-900
          border border-gray-200 dark:border-gray-800
          rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30
          overflow-hidden
          animate-[fadeIn_0.15s_ease-out]
        ">
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="
              flex items-center gap-3 px-4 py-4
              border-b border-gray-100 dark:border-gray-800
              hover:bg-gray-50 dark:hover:bg-gray-800/50
              transition
            "
          >
            <div className="relative flex-shrink-0">
              <div className="
                w-12 h-12 rounded-full overflow-hidden flex items-center justify-center
                bg-gradient-to-br from-brand-500 to-purple-500
                text-white text-lg font-bold
              ">
                {avatarUrl ? (
                  <img src={`${API_BASE}${avatarUrl}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              {unreadCount > 0 && (
                <span className="
                  absolute -top-1 -right-1 
                  min-w-[20px] h-5 px-1
                  bg-red-500 text-white text-xs font-bold rounded-full 
                  flex items-center justify-center
                  border-2 border-white dark:border-gray-900
                ">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white truncate">
                {user?.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </div>
              {unreadCount > 0 && (
                <div className="text-xs text-red-500 font-semibold mt-0.5">
                  {unreadCount} new message{unreadCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </Link>

          <div className="py-2">
            <MenuItem to="/profile" onClick={() => setOpen(false)} icon={<UserIcon />} badge={unreadCount}>
              View Profile
            </MenuItem>
            <MenuItem to="/history" onClick={() => setOpen(false)} icon={<HistoryIcon />}>
              Survey History
            </MenuItem>
            <MenuItem to="/my-favorites" onClick={() => setOpen(false)} icon={<HeartIcon />}>
              សាលាដែលខ្ញុំចូលចិត្ត
            </MenuItem>
            <MenuItem to="/chat-history" onClick={() => setOpen(false)} icon={<ChatIcon />}>
              Chat History
            </MenuItem>
            <MenuItem to="/settings" onClick={() => setOpen(false)} icon={<SettingsIcon />}>
              Settings
            </MenuItem>
          </div>

          <div className="py-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleLogout}
              className="
                w-full flex items-center gap-3 px-4 py-2.5
                text-sm font-medium text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20
                transition
              "
            >
              <LogoutIcon />
              Logout
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}


function MenuItem({ to, onClick, icon, children, badge }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="
        flex items-center gap-3 px-4 py-2.5
        text-sm font-medium text-gray-700 dark:text-gray-300
        hover:bg-gray-50 dark:hover:bg-gray-800/50
        transition
      "
    >
      <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      <span className="flex-1">{children}</span>
      {badge > 0 && (
        <span className="
          min-w-[20px] h-5 px-1.5
          bg-red-500 text-white text-xs font-bold rounded-full 
          flex items-center justify-center
        ">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}


function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}