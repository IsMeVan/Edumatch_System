import { useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function ReportButton() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  
  if (!user) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-40 px-4 py-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 text-sm font-medium flex items-center gap-2 transition hover:scale-105"
        title="Report a bug or send feedback"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Report
      </button>

      {open && <ReportModal onClose={() => setOpen(false)} />}
    </>
  )
}


function ReportModal({ onClose }) {
  const [type, setType] = useState('bug')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) {
      setError('Please describe the issue or feedback')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      await api.post('/reports', {
        type,
        subject: subject.trim() || null,
        message: message.trim(),
        page_url: window.location.pathname,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div 
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Thank you!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Your report has been submitted. Our team will review it soon.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Send Report
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Help us improve EduMatch
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type of Report
            </label>
            <div className="grid grid-cols-2 gap-2">
              <TypeButton active={type === 'bug'} onClick={() => setType('bug')} icon={<BugIcon />} label="Bug" desc="Something broken" />
              <TypeButton active={type === 'feedback'} onClick={() => setType('feedback')} icon={<FeedbackIcon />} label="Feedback" desc="Suggestion" />
              <TypeButton active={type === 'missing_data'} onClick={() => setType('missing_data')} icon={<DataIcon />} label="Missing Data" desc="School/major missing" />
              <TypeButton active={type === 'other'} onClick={() => setType('other')} icon={<OtherIcon />} label="Other" desc="Anything else" />
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              Subject (optional)
            </span>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Short summary..."
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              Description <span className="text-red-500">*</span>
            </span>
            <textarea
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe the issue or your feedback in detail..."
              rows={5}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              {message.length} characters
            </p>
          </label>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-400">
            Your current page ({window.location.pathname}) will be included automatically to help us locate the issue.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="px-6 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


function TypeButton({ active, onClick, icon, label, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-lg border text-left transition ${
        active
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className={`mb-1 ${active ? 'text-brand-600' : 'text-gray-500'}`}>
        {icon}
      </div>
      <div className={`text-sm font-semibold ${active ? 'text-brand-700 dark:text-brand-300' : 'text-gray-900 dark:text-white'}`}>
        {label}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{desc}</div>
    </button>
  )
}


function BugIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function FeedbackIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> }
function DataIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg> }
function OtherIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }