import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import FavoriteButton from '../components/FavoriteButton'

export default function MyFavorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const res = await api.get('/favorites/')
      setFavorites(res.data.favorites || [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFavorites()
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading your favorites...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="
          w-12 h-12 rounded-xl flex items-center justify-center
          bg-gradient-to-br from-red-500 to-pink-500
          text-white
        ">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            សាលាដែលខ្ញុំចូលចិត្ត
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {favorites.length} {favorites.length === 1 ? 'school' : 'schools'} favorited
          </p>
        </div>
      </div>

      {error && (
        <div className="
          bg-red-50 dark:bg-red-900/20
          border border-red-200 dark:border-red-800
          text-red-700 dark:text-red-300
          rounded-2xl p-4 mb-6
        ">
          {error}
        </div>
      )}

      {favorites.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map(school => (
            <FavoriteCard
              key={school.id}
              school={school}
              onRemoved={loadFavorites}
            />
          ))}
        </div>
      )}
    </div>
  )
}


function FavoriteCard({ school, onRemoved }) {
  const initial = school.name?.charAt(0)?.toUpperCase() || 'U'
  const isPublic = school.type?.includes('សាធារណៈ')

  return (
    <div className="
      bg-white dark:bg-gray-900
      border border-gray-100 dark:border-gray-800
      rounded-2xl shadow-md p-5
      hover:shadow-xl hover:border-brand-300 dark:hover:border-brand-700
      transition-all duration-200
    ">
      <div className="flex items-start justify-between mb-3">
        <div className="
          w-14 h-14 rounded-xl flex items-center justify-center
          bg-gradient-to-br from-brand-500 to-purple-500
          text-white text-2xl font-bold
          flex-shrink-0
        ">
          {initial}
        </div>
        
        <div className="flex items-center gap-2">
          <FavoriteButton
            schoolId={school.id}
            size="sm"
            onChange={(newCount, isFav) => {
              if (!isFav) onRemoved()
            }}
          />
          {school.type && (
            <span className={`
              px-2.5 py-1 rounded-full text-xs font-semibold
              ${isPublic
                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
                : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
              }
            `}>
              {isPublic ? 'សាធារណៈ' : 'ឯកជន'}
            </span>
          )}
        </div>
      </div>

      <Link to={`/school/${school.id}`} className="block">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 min-h-[3rem] hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          {school.name}
        </h3>

        {school.region && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
            <PinIcon />
            {school.region}
          </p>
        )}

        <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
          <Stat label="ផ្នែក" value={school.departments || 0} />
          <Stat label="មុខវិជ្ជា" value={school.majors || 0} />
          <Stat 
            label="សរុបចូលចិត្ត" 
            value={school.total_favorites || 0} 
            highlight 
          />
        </div>
      </Link>
    </div>
  )
}


function EmptyState() {
  return (
    <div className="
      bg-white dark:bg-gray-900
      border border-gray-100 dark:border-gray-800
      rounded-2xl p-12 text-center
    ">
      <div className="
        w-20 h-20 mx-auto mb-4 rounded-full
        bg-red-50 dark:bg-red-900/20
        flex items-center justify-center
      ">
        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        មិនទាន់មានសាលាទេ
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        បន្ថែមសាលាដែលអ្នកចូលចិត្តចូលក្នុងបញ្ជី
      </p>
      <Link
        to="/schools"
        className="
          inline-block px-6 py-2.5 rounded-full
          bg-brand-500 hover:bg-brand-600
          text-white font-semibold
          transition
        "
      >
        រកមើលសាលា
      </Link>
    </div>
  )
}


function Stat({ label, value, highlight = false }) {
  return (
    <div>
      <div className={`text-base font-bold ${
        highlight
          ? 'text-red-500 dark:text-red-400'
          : 'text-gray-900 dark:text-white'
      }`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide">{label}</div>
    </div>
  )
}


function PinIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}