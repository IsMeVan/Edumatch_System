import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function History() {
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const res = await api.get('/history/')
      setSurveys(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading your history...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your History</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {surveys.length === 0
            ? 'No surveys yet'
            : `${surveys.length} survey${surveys.length > 1 ? 's' : ''} submitted`}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          ដើម្បីលុបការស្ទង់មតិ សូមចូលទៅ Settings
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg p-3 mb-6">
          {error}
        </div>
      )}

      {surveys.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 text-center border border-gray-200 dark:border-gray-800">
          <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't submitted any surveys yet.</p>
          <Link
            to="/survey"
            className="inline-block px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium"
          >
            Take Your First Survey
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {surveys.map((s) => (
            <SurveyCard key={s.survey_id} survey={s} />
          ))}
        </div>
      )}
    </div>
  )
}


function SurveyCard({ survey }) {
  const date = new Date(survey.submitted_at)
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const gpaLabel = {
    high: 'ខ្ពស់ (3.5-4.0)',
    medium: 'មធ្យម (2.5-3.4)',
    low: 'ទាប (ក្រោម 2.5)',
  }[survey.gpa_level] || survey.gpa_level

  return (
    <div className="
      bg-white dark:bg-gray-900
      rounded-2xl shadow-md
      border border-gray-100 dark:border-gray-800
      p-6 hover:shadow-lg transition
    ">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{survey.career_interest}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{dateStr}</p>
        </div>
        <div className="text-right">
          <div className="px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded-full text-xs font-semibold">
            {survey.recommendation_count} matches
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-sm">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Track</span>
          <p className="font-medium text-gray-800 dark:text-gray-200">{survey.study_track}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">GPA</span>
          <p className="font-medium text-gray-800 dark:text-gray-200">{gpaLabel}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Subjects</span>
          <p className="font-medium text-gray-800 dark:text-gray-200">{survey.strong_subjects.length} selected</p>
        </div>
      </div>

      {survey.strong_subjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {survey.strong_subjects.map((s, idx) => (
            <span key={idx} className="
              px-2.5 py-1 rounded-md text-xs
              bg-gray-100 dark:bg-gray-800
              text-gray-700 dark:text-gray-300
            ">
              {s}
            </span>
          ))}
        </div>
      )}

      {survey.free_text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-4 line-clamp-2">"{survey.free_text}"</p>
      )}

      <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
        <Link
          to={`/results/${survey.survey_id}`}
          className="
            px-4 py-2 text-sm font-medium rounded-lg
            text-brand-600 dark:text-brand-400
            hover:bg-brand-50 dark:hover:bg-brand-900/20
            transition
          "
        >
          View Results →
        </Link>
      </div>
    </div>
  )
}