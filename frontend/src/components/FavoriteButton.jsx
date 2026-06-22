import { useEffect, useState } from 'react'
import api from '../api'

/*
  Reusable favorite button.
  Props:
    - schoolId: required, the institution ID
    - size: 'sm' | 'md' | 'lg' (default 'md')
    - showCount: boolean, show "234 favorites" text (default true)
    - onChange: callback(newCount, isFavorited)
*/
export default function FavoriteButton({
  schoolId,
  size = 'md',
  showCount = true,
  onChange,
}) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [animate, setAnimate] = useState(false)

  // Check initial state
  useEffect(() => {
    if (!schoolId) return
    const checkStatus = async () => {
      try {
        const res = await api.get(`/favorites/check/${schoolId}`)
        setIsFavorited(res.data.is_favorited)
        setCount(res.data.favorite_count)
      } catch (err) {
        // Not logged in or error — silently fail
      }
    }
    checkStatus()
  }, [schoolId])

  const toggle = async (e) => {
    // Prevent navigating to school page when clicking heart in card
    e.preventDefault()
    e.stopPropagation()
    
    if (loading) return
    setLoading(true)
    
    try {
      const res = isFavorited
        ? await api.delete(`/favorites/${schoolId}`)
        : await api.post(`/favorites/${schoolId}`)
      
      const newFavorited = !isFavorited
      const newCount = res.data.favorite_count
      
      setIsFavorited(newFavorited)
      setCount(newCount)
      setAnimate(true)
      setTimeout(() => setAnimate(false), 400)
      
      if (onChange) onChange(newCount, newFavorited)
    } catch (err) {
      if (err.response?.status === 401) {
        alert('សូមចូលគណនី ដើម្បីបន្ថែមសាលា')
      } else {
        console.error(err)
      }
    } finally {
      setLoading(false)
    }
  }

  // Size classes
  const sizeMap = {
    sm: { icon: 'w-4 h-4', container: 'p-1.5', text: 'text-xs' },
    md: { icon: 'w-5 h-5', container: 'p-2',   text: 'text-sm' },
    lg: { icon: 'w-6 h-6', container: 'p-2.5', text: 'text-base' },
  }
  const sz = sizeMap[size] || sizeMap.md

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`
        inline-flex items-center gap-1.5 rounded-full
        transition-all duration-200
        ${isFavorited
          ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }
        ${sz.container}
        ${animate ? 'scale-125' : 'scale-100'}
        disabled:opacity-50
      `}
      aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
    >
      {/* Heart icon — SVG (filled vs outline based on state) */}
      <svg
        className={`${sz.icon} transition-all`}
        fill={isFavorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
        />
      </svg>
      
      {showCount && (
        <span className={`font-semibold ${sz.text}`}>
          {count}
        </span>
      )}
    </button>
  )
}