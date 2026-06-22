import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import NotificationsList from '../components/NotificationsList'

const API_BASE = 'http://localhost:8000'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/me')
      .then(r => setProfile(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
      </div>
    )
  }

  const initial = profile?.name?.charAt(0)?.toUpperCase() || 'U'
  const avatarSrc = profile?.avatar_url ? `${API_BASE}${profile.avatar_url}` : null

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      {/* Header with edit button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <Link
          to="/settings"
          className="
            inline-flex items-center gap-2 px-4 py-2 rounded-lg
            bg-brand-600 hover:bg-brand-700 text-white
            font-medium text-sm transition
          "
        >
          <PencilIcon />
          កែសម្រួល
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="
            w-28 h-28 rounded-full overflow-hidden flex-shrink-0
            bg-gradient-to-br from-brand-500 to-purple-500
            text-white text-5xl font-bold
            flex items-center justify-center
            border-4 border-white dark:border-gray-900
            shadow-xl
          ">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{profile?.email}</p>
            {profile?.bio ? (
              <p className="text-gray-700 dark:text-gray-300 mt-3 whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic mt-3 text-sm">
                មិនទាន់មានជីវប្រវត្តិ
              </p>
            )}
          </div>
        </div>
      </div>


      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          to="/my-favorites"
          icon={<HeartIcon />}
          title="សាលាដែលខ្ញុំចូលចិត្ត"
          subtitle="View your favorite schools"
          color="red"
        />
        <QuickActionCard
          to="/history"
          icon={<HistoryIcon />}
          title="ប្រវត្តិការស្ទង់មតិ"
          subtitle="Your survey results"
          color="brand"
        />
        <QuickActionCard
          to="/chat-history"
          icon={<ChatIcon />}
          title="ប្រវត្តិការសន្ទនា"
          subtitle="Your AI chat history"
          color="purple"
        />
      </div>
      {/* Notifications - FULL WIDTH (outside the grid) */}
      <NotificationsList />
    </div>
  )
}


/* ─── Quick Action Card ─── */
function QuickActionCard({ to, icon, title, subtitle, color }) {
  const colors = {
    red: 'from-red-500 to-pink-500',
    brand: 'from-brand-500 to-purple-500',
    purple: 'from-purple-500 to-indigo-500',
  }
  
  return (
    <Link
      to={to}
      className="
        bg-white dark:bg-gray-900
        border border-gray-100 dark:border-gray-800
        rounded-2xl shadow-md p-5
        hover:shadow-xl hover:-translate-y-1
        transition-all duration-200
        group
      "
    >
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center
        bg-gradient-to-br ${colors[color]}
        text-white mb-3
        group-hover:scale-110 transition-transform
      `}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {subtitle}
      </p>
    </Link>
  )
}


/* ─── Icons ─── */

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}