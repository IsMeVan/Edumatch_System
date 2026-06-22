import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'

export default function Results() {
  const { surveyId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/recommend/${surveyId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [surveyId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Finding your perfect matches...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-red-600 mb-4 break-words">{error}</p>
        <Link to="/survey" className="text-brand-600 hover:underline">Try again</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 break-words">Your Recommendations</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 break-words">
          Based on your interest in <span className="font-semibold text-brand-700 dark:text-brand-400">{data?.career_interest}</span> ·
          Found {data?.total_matches} matches
        </p>
      </div>

      {data?.results.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-10 text-center border border-gray-200 dark:border-gray-800">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">No matches found for this career interest.</p>
          <Link to="/survey" className="text-brand-600 hover:underline font-medium">Try another survey</Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {data?.results.map((r, idx) => (
            <ResultCard key={idx} rank={idx + 1} result={r} />
          ))}
        </div>
      )}

      <div className="text-center mt-8 sm:mt-10">
        <Link
          to="/survey"
          className="
            inline-block px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base
            bg-white dark:bg-gray-900
            border border-gray-300 dark:border-gray-700
            hover:bg-gray-50 dark:hover:bg-gray-800
            text-gray-700 dark:text-gray-300
          "
        >
          Take Another Survey
        </Link>
      </div>
    </div>
  )
}


function ResultCard({ rank, result }) {
  const { institution, department, major, scholarship, similarity_score } = result

  const matchPercent = similarity_score ? (similarity_score * 100).toFixed(1) : null
  let matchColor = 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
  if (similarity_score >= 0.7) matchColor = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  else if (similarity_score >= 0.5) matchColor = 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
  else if (similarity_score >= 0.3) matchColor = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'

  return (
    <div className="
      bg-white dark:bg-gray-900
      rounded-2xl shadow-md
      border border-gray-100 dark:border-gray-800
      p-4 sm:p-6 hover:shadow-lg transition
    ">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="
          w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-sm sm:text-lg flex-shrink-0
          bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400
        ">
          #{rank}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + Match Badge - wraps on mobile */}
          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-1 flex-wrap sm:flex-nowrap">
            <Link
              to={`/school/${institution.id}`}
              className="
                text-base sm:text-lg font-bold
                text-gray-900 dark:text-white
                hover:text-brand-600 dark:hover:text-brand-400
                transition break-words min-w-0 flex-1
              "
            >
              {institution.name}
            </Link>
            {matchPercent && (
              <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 ${matchColor}`}>
                {matchPercent}% match
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 break-words">
            {institution.type} · {institution.region}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
            <div className="min-w-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Major</span>
              <p className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200 break-words">{major.name}</p>
            </div>
            <div className="min-w-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Department</span>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 break-words">{department}</p>
            </div>
          </div>

          {scholarship ? (
            <div className="
              bg-gradient-to-r from-amber-50 to-orange-50
              dark:from-amber-900/20 dark:to-orange-900/20
              border border-amber-200 dark:border-amber-800
              rounded-lg p-3 mt-3
            ">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase">Scholarship Available</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mt-1 break-words">{scholarship.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{scholarship.coverage_percentage}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">coverage</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">No scholarship data for this major</p>
          )}

          {/* Action row */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex-wrap">
            <Link
              to={`/school/${institution.id}`}
              className="
                text-xs sm:text-sm font-medium
                text-brand-600 dark:text-brand-400
                hover:underline
                break-words
              "
            >
              មើលព័ត៌មានសាលា →
            </Link>
            <FavoriteButton schoolId={institution.id} />
          </div>
        </div>
      </div>
    </div>
  )
}


/* Favorite Button */
function FavoriteButton({ schoolId }) {
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/users/me/favorites/check/${schoolId}`)
      .then(res => setFavorited(res.data.favorited))
      .catch(() => { })
  }, [schoolId])

  const toggle = async () => {
    setLoading(true)
    try {
      if (favorited) {
        await api.delete(`/users/me/favorites/${schoolId}`)
        setFavorited(false)
      } else {
        await api.post(`/users/me/favorites/${schoolId}`)
        setFavorited(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`
        flex-shrink-0 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full
        text-xs font-medium
        transition whitespace-nowrap
        ${favorited
          ? 'bg-amber-500 text-white hover:bg-amber-600'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-amber-900/30'
        }
      `}
    >
      {favorited ? (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.97c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.785.57-1.84-.196-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.967z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.97c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.785.57-1.84-.196-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.967z" />
        </svg>
      )}
      {favorited ? 'រួចហើយ' : 'បន្ថែម'}
    </button>
  )
}