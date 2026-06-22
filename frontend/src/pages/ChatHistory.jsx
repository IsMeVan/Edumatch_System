import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function ChatHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const res = await api.get('/chat/conversations')
      setConversations(res.data.conversations)
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  const startNewChat = () => {
    // Dispatch event to open chat bubble with new chat
    window.dispatchEvent(new CustomEvent('open-chat', { detail: { conversationId: null } }))
  }

  const openConversation = (convId) => {
    window.dispatchEvent(new CustomEvent('open-chat', { detail: { conversationId: convId } }))
  }

  const deleteConversation = async (convId, e) => {
    e.stopPropagation()
    if (!window.confirm('លុបការសន្ទនានេះមែនទេ?')) return
    try {
      await api.delete(`/chat/conversations/${convId}`)
      setConversations(prev => prev.filter(c => c.id !== convId))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const toggleSelect = (convId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(convId)) next.delete(convId)
      else next.add(convId)
      return next
    })
  }

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`លុបការសន្ទនា ${selectedIds.size} មែនទេ?`)) return
    try {
      await Promise.all([...selectedIds].map(id => api.delete(`/chat/conversations/${id}`)))
      setConversations(prev => prev.filter(c => !selectedIds.has(c.id)))
      setSelectedIds(new Set())
      setSelectMode(false)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  // Filter by search
  const filtered = conversations.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  )

  // Format relative time
  const formatTime = (iso) => {
    if (!iso) return ''
    const now = new Date()
    const date = new Date(iso)
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`
    if (diffDay === 1) return 'yesterday'
    if (diffDay < 7) return `${diffDay} days ago`
    if (diffDay < 14) return 'last week'
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} weeks ago`
    if (diffDay < 60) return 'last month'
    return `${Math.floor(diffDay / 30)} months ago`
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0b1020]">
        <p className="text-gray-600 dark:text-gray-300">សូមចូលគណនី</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1020] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chats</h1>
          <div className="flex items-center gap-2">
            {selectMode ? (
              <>
                <button
                  onClick={deleteSelected}
                  disabled={selectedIds.size === 0}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete ({selectedIds.size})
                </button>
                <button
                  onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }}
                  className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectMode(true)}
                  disabled={conversations.length === 0}
                  className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Select chats
                </button>
                <button
                  onClick={startNewChat}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-white text-gray-900 dark:text-gray-900 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-100 transition shadow-sm"
                >
                  New chat
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-900 border-2 border-transparent focus:border-brand-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 transition"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16">
            <svg className="w-8 h-8 animate-spin mx-auto text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.85-3.36L20 7M20 15a9 9 0 01-14.85 3.36L4 17" />
            </svg>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">កំពុងផ្ទុក...</p>
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState onStart={startNewChat} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">រកមិនឃើញលទ្ធផល</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {filtered.map((conv, idx) => (
              <div
                key={conv.id}
                onClick={() => selectMode ? toggleSelect(conv.id) : openConversation(conv.id)}
                className={`
                  group flex items-center gap-3 px-5 py-4 cursor-pointer transition
                  ${idx !== filtered.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}
                  ${selectedIds.has(conv.id) ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                `}
              >
                {selectMode && (
                  <div className={`
                    w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition
                    ${selectedIds.has(conv.id) 
                      ? 'bg-brand-500 border-brand-500' 
                      : 'border-gray-300 dark:border-gray-600'}
                  `}>
                    {selectedIds.has(conv.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {conv.title}
                  </h3>
                  {conv.last_message && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {conv.last_message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatTime(conv.updated_at)}
                  </span>
                  {!selectMode && (
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


function EmptyState({ onStart }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-100 to-purple-100 dark:from-brand-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        មិនទាន់មានការសន្ទនាទេ
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        ចាប់ផ្តើមការសន្ទនាជាមួយ EduMatch AI ដើម្បីសួរអំពីសាលា មុខវិជ្ជា និងអាហារូបករណ៍។
      </p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-white font-medium hover:scale-105 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Start new chat
      </button>
    </div>
  )
}