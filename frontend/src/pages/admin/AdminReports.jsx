import { useEffect, useState } from 'react'
import api from '../../api'

const TYPE_INFO = {
  bug: { label: 'Bug', color: 'red' },
  feedback: { label: 'Feedback', color: 'blue' },
  missing_data: { label: 'Missing Data', color: 'amber' },
  other: { label: 'Other', color: 'gray' },
}

const STATUS_INFO = {
  new: { label: 'New', color: 'blue' },
  in_progress: { label: 'In Progress', color: 'blue' },
  resolved: { label: 'Resolved', color: 'green' },
  dismissed: { label: 'Dismissed', color: 'gray' },
}

export default function AdminReports() {
  const [data, setData] = useState({ reports: [], counts: {} })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)

  const loadReports = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.append('status', statusFilter)
    if (typeFilter) params.append('type', typeFilter)

    api.get(`/reports/admin/all?${params}`)
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadReports() }, [statusFilter, typeFilter])

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await api.patch(`/reports/admin/${reportId}/status`, { status: newStatus })
      loadReports()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update')
    }
  }

  const handleDelete = async (reportId) => {
    if (!confirm('Delete this report?')) return
    try {
      await api.delete(`/reports/admin/${reportId}`)
      setSelectedReport(null)
      loadReports()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Reports</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Bug reports, feedback, and suggestions from users
        </p>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CountCard label="New" value={data.counts.new || 0} color="blue" onClick={() => setStatusFilter('new')} active={statusFilter === 'new'} />
        <CountCard label="In Progress" value={data.counts.in_progress || 0} color="blue" onClick={() => setStatusFilter('in_progress')} active={statusFilter === 'in_progress'} />
        <CountCard label="Resolved" value={data.counts.resolved || 0} color="green" onClick={() => setStatusFilter('resolved')} active={statusFilter === 'resolved'} />
        <CountCard label="All" value={data.counts.total || 0} color="gray" onClick={() => setStatusFilter('')} active={statusFilter === ''} />
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        <FilterChip active={typeFilter === ''} onClick={() => setTypeFilter('')}>All Types</FilterChip>
        <FilterChip active={typeFilter === 'bug'} onClick={() => setTypeFilter('bug')}>Bugs</FilterChip>
        <FilterChip active={typeFilter === 'feedback'} onClick={() => setTypeFilter('feedback')}>Feedback</FilterChip>
        <FilterChip active={typeFilter === 'missing_data'} onClick={() => setTypeFilter('missing_data')}>Missing Data</FilterChip>
        <FilterChip active={typeFilter === 'other'} onClick={() => setTypeFilter('other')}>Other</FilterChip>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : data.reports.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-gray-500">No reports match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.reports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={() => setSelectedReport(report)}
            />
          ))}
        </div>
      )}

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onStatusChange={(status) => handleStatusChange(selectedReport.id, status)}
          onDelete={() => handleDelete(selectedReport.id)}
        />
      )}
    </div>
  )
}


function CountCard({ label, value, color, onClick, active }) {
  const colors = {
    blue: active ? 'bg-blue-500 text-white border-blue-500' : 'border-blue-200 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    green: active ? 'bg-green-500 text-white border-green-500' : 'border-green-200 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20',
    gray: active ? 'bg-gray-500 text-white border-gray-500' : 'border-gray-200 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
  }
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 text-left transition ${colors[color]}`}
    >
      <div className="text-sm opacity-80">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </button>
  )
}


function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${active
          ? 'bg-brand-500 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
        }`}
    >
      {children}
    </button>
  )
}


function ReportCard({ report, onClick }) {
  const typeInfo = TYPE_INFO[report.type] || TYPE_INFO.other
  const statusInfo = STATUS_INFO[report.status] || STATUS_INFO.new

  const date = new Date(report.created_at).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 text-left hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
            typeInfo.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            typeInfo.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
            typeInfo.color === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {typeInfo.label}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
            statusInfo.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {statusInfo.label}
          </span>
        </div>
        <div className="text-xs text-gray-400">{date}</div>
      </div>

      {report.subject && (
        <div className="font-semibold text-gray-900 dark:text-white mb-1">{report.subject}</div>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
        {report.message}
      </div>

      {report.user && (
        <div className="text-xs text-gray-500">
          From: {report.user.name} ({report.user.email})
        </div>
      )}
    </button>
  )
}

function ReportDetailModal({ report: initialReport, onClose, onStatusChange, onDelete }) {
  const [report, setReport] = useState(initialReport)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const typeInfo = TYPE_INFO[report.type] || TYPE_INFO.other
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const TEMPLATES = [
    { label: 'Thanks for feedback', text: 'អរគុណសម្រាប់ការផ្តល់មតិយោបល់របស់អ្នក។ ក្រុមការងាររបស់យើងនឹងពិចារណាដោយប្រុងប្រយ័ត្ន។' },
    { label: 'Bug fixed', text: 'យើងបានជួសជុលបញ្ហានេះហើយ។ សូមព្យាយាមម្តងទៀត ហើយប្រាប់យើងបើនៅតែមានបញ្ហា។' },
    { label: 'Working on it', text: 'យើងកំពុងស្រាវជ្រាវបញ្ហានេះ។ យើងនឹងជូនដំណឹងពេលដោះស្រាយរួចរាល់។' },
    { label: 'Need more info', text: 'អរគុណសម្រាប់របាយការណ៍។ តើអ្នកអាចផ្តល់ព័ត៌មានបន្ថែមអំពីបញ្ហានេះបានទេ?' },
    { label: 'Data added', text: 'យើងបានបន្ថែមព័ត៌មានដែលអ្នកស្នើរហើយ។ សូមពិនិត្យមើល!' },
    { label: 'Not a bug', text: 'អរគុណសម្រាប់របាយការណ៍។ បន្ទាប់ពីពិនិត្យ យើងឃើញថានេះជាមុខងារធម្មតារបស់ប្រព័ន្ធ មិនមែនបញ្ហាទេ។' },
  ]

  const handleStatusClick = async (newStatus) => {
    if (report.status === newStatus) return

    setUpdatingStatus(newStatus)
    try {
      await api.patch(`/reports/admin/${report.id}/status`, { status: newStatus })
      setReport({ ...report, status: newStatus })
      if (onStatusChange) onStatusChange(newStatus, true)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      alert('សូមសរសេរការឆ្លើយតប')
      return
    }

    setSending(true)
    try {
      await api.patch(`/reports/admin/${report.id}/reply`, {
        admin_reply: replyText.trim()
      })
      await api.patch(`/reports/admin/${report.id}/status`, {
        status: 'resolved'
      })
      setReport({ ...report, admin_reply: replyText.trim(), status: 'resolved' })
      setReplyText('')
      alert('បានផ្ញើការឆ្លើយតបហើយ!')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-gray-100 dark:bg-gray-800">
                {typeInfo.label}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                report.status === 'new' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                report.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                report.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {STATUS_INFO[report.status]?.label || report.status}
              </span>
            </div>
            {report.subject && (
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {report.subject}
              </h3>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Message</div>
            <div className="text-gray-900 dark:text-white whitespace-pre-wrap p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {report.message}
            </div>
          </div>

          {report.user && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
              <div className="text-xs text-gray-500 mb-1">Reported by</div>
              <div className="font-semibold text-gray-900 dark:text-white">{report.user.name}</div>
              <div className="text-xs text-gray-500">{report.user.email}</div>
            </div>
          )}

          {report.page_url && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Page</div>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{report.page_url}</code>
            </div>
          )}

          {report.admin_reply && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="text-xs text-green-700 dark:text-green-400 font-bold mb-1">Previous Reply</div>
              <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {report.admin_reply}
              </div>
            </div>
          )}

          {/* Status Buttons */}
          <div>
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
              Change Status
              {updatingStatus && (
                <span className="text-brand-600 animate-pulse">Updating...</span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(STATUS_INFO).map(([key, info]) => {
                const isActive = report.status === key
                const isLoading = updatingStatus === key

                const colorStyles = {
                  blue: isActive
                    ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                    : 'border-blue-200 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300',
                  green: isActive
                    ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30'
                    : 'border-green-200 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300',
                  gray: isActive
                    ? 'bg-gray-500 text-white border-gray-500 shadow-lg shadow-gray-500/30'
                    : 'border-gray-200 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300',
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleStatusClick(key)}
                    disabled={updatingStatus !== null}
                    className={`
                      relative px-3 py-2.5 rounded-lg text-sm font-semibold 
                      border-2 transition-all duration-200
                      transform active:scale-95
                      disabled:opacity-50 disabled:cursor-not-allowed
                      cursor-pointer
                      ${colorStyles[info.color]}
                      ${isLoading ? 'animate-pulse' : ''}
                    `}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving
                      </span>
                    ) : (
                      <>
                        {isActive && (
                          <svg className="w-3.5 h-3.5 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {info.label}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reply Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Send Reply to User
            </div>

            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-2">Quick Templates:</div>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((tmpl, i) => (
                  <button
                    key={i}
                    onClick={() => setReplyText(tmpl.text)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-gray-800 hover:bg-brand-100 dark:hover:bg-brand-900/30 text-gray-700 dark:text-gray-300 transition cursor-pointer active:scale-95"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply or select a template above..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />

            <button
              onClick={handleSendReply}
              disabled={sending || !replyText.trim()}
              className="mt-3 w-full px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition"
            >
              {sending ? 'Sending...' : 'Send Reply (auto-marks as Resolved)'}
            </button>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onDelete}
              className="px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm active:scale-95 transition"
            >
              Delete Report
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-200 active:scale-95 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}