import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

const BACKEND_URL = 'http://localhost:8000'
const CHAR_DELAY = 40  // ms per character (lower = faster typing)

export default function ChatBubble() {
  const { user } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const previousUserId = useRef(user?.id)

  // Typing queue refs
  const typingQueueRef = useRef([])
  const typingIntervalRef = useRef(null)

  const schoolMatch = location.pathname.match(/^\/school\/(\d+)/)
  const currentSchoolId = schoolMatch ? parseInt(schoolMatch[1]) : null

  // Start the character drip timer
  const startTypingInterval = (botMsgId) => {
    if (typingIntervalRef.current) return
    typingIntervalRef.current = setInterval(() => {
      if (typingQueueRef.current.length === 0) return
      const char = typingQueueRef.current.shift()
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, text: m.text + char } : m
      ))
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, CHAR_DELAY)
  }

  // Drain remaining queue, then stop and mark done
  const finishTyping = (botMsgId) => {
    const drain = setInterval(() => {
      if (typingQueueRef.current.length === 0) {
        clearInterval(drain)
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current)
          typingIntervalRef.current = null
        }
        setMessages(prev => prev.map(m =>
          m.id === botMsgId ? { ...m, streaming: false } : m
        ))
      }
    }, CHAR_DELAY)
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
    }
  }, [])

  // Reset chat when user changes
  useEffect(() => {
    const currentUserId = user?.id || null
    if (previousUserId.current !== currentUserId) {
      setIsOpen(false)
      setMessages([])
      setConversationId(null)
      setInput('')
      typingQueueRef.current = []
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
        typingIntervalRef.current = null
      }
    }
    previousUserId.current = currentUserId
  }, [user?.id])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Listen for "open chat with conversation" events
  useEffect(() => {
    const handleOpenChat = (e) => {
      const convId = e.detail?.conversationId
      if (convId) {
        loadConversation(convId)
        setIsOpen(true)
      } else {
        startNewChat()
        setIsOpen(true)
      }
    }
    window.addEventListener('open-chat', handleOpenChat)
    return () => window.removeEventListener('open-chat', handleOpenChat)
  }, [])

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0 && !conversationId) {
      setMessages([{
        id: 'welcome-' + Date.now(),
        role: 'bot',
        text: 'សួស្តី! ខ្ញុំជាជំនួយការ EduMatch។ តើខ្ញុំអាចជួយអ្នកដោយរបៀបណា?',
        time: new Date(),
      }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const startNewChat = () => {
    typingQueueRef.current = []
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
      typingIntervalRef.current = null
    }
    setMessages([{
      id: 'welcome-' + Date.now(),
      role: 'bot',
      text: 'សួស្តី! ខ្ញុំជាជំនួយការ EduMatch។ តើខ្ញុំអាចជួយអ្នកដោយរបៀបណា?',
      time: new Date(),
    }])
    setConversationId(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const loadConversation = async (convId) => {
    try {
      const res = await api.get(`/chat/conversations/${convId}`)
      const msgs = res.data.messages.map(m => ({
        id: `loaded-${m.id}`,
        role: m.role,
        text: m.content,
        time: new Date(m.created_at),
      }))
      setMessages(msgs)
      setConversationId(convId)
    } catch (err) {
      console.error('Failed to load conversation:', err)
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = {
      id: 'user-' + Date.now(),
      role: 'user',
      text,
      time: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const botMsgId = 'bot-' + Date.now()
    let botBubbleAdded = false

    // Reset queue for this message
    typingQueueRef.current = []

    try {
      const token = sessionStorage.getItem('token')

      const res = await fetch(`${BACKEND_URL}/chat/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
          ...(currentSchoolId && { school_id: currentSchoolId }),
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue

          const jsonStr = trimmed.slice(5).trim()
          if (!jsonStr) continue

          let data
          try {
            data = JSON.parse(jsonStr)
          } catch {
            continue
          }

          if (data.type === 'meta') {
            if (data.conversation_id && !conversationId) {
              setConversationId(data.conversation_id)
            }
          } else if (data.type === 'chunk') {
            let chunkText = data.text

            if (!botBubbleAdded) {
              chunkText = chunkText.replace(/^[\s\n]+/, '')
              if (!chunkText) continue

              botBubbleAdded = true
              setLoading(false)
              setMessages(prev => [...prev, {
                id: botMsgId,
                role: 'bot',
                text: '',
                time: new Date(),
                streaming: true,
              }])
              startTypingInterval(botMsgId)
            }

            // Push each character into the typing queue
            for (const char of chunkText) {
              typingQueueRef.current.push(char)
            }
          } else if (data.type === 'done') {
            finishTyping(botMsgId)
          }
        }
      }

      // Safety: ensure typing finishes after stream ends
      if (botBubbleAdded) {
        finishTyping(botMsgId)
      }

    } catch (err) {
      console.error('Chat stream error:', err)
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
        typingIntervalRef.current = null
      }
      typingQueueRef.current = []

      const errText = err.message?.includes('401')
        ? 'សម័យកាលរបស់អ្នកបានផុតកំណត់។ សូមចូលគណនីម្តងទៀត។'
        : 'សុំទោស ខ្ញុំជួបបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្តងទៀត។'

      if (botBubbleAdded) {
        setMessages(prev => prev.map(m =>
          m.id === botMsgId
            ? { ...m, text: errText, error: true, streaming: false }
            : m
        ))
      } else {
        setMessages(prev => [...prev, {
          id: botMsgId,
          role: 'bot',
          text: errText,
          time: new Date(),
          error: true,
          streaming: false,
        }])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestions = [
    'តើ RUPP មាននៅឯណា?',
    'តើ EduMatch មានសាលាប៉ុន្មាន?',
    'តើសាលាណាខ្លះមានអាហារូបករណ៍?',
  ]

  const hiddenPaths = ['/login', '/register']
  if (hiddenPaths.includes(location.pathname)) return null
  if (!user) return null

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-2xl shadow-brand-500/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center"
          aria-label="Open chat"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute inset-0 rounded-full bg-brand-500/30 animate-ping" />
          <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
            <span className="text-[8px] sm:text-[10px] font-bold text-white">AI</span>
          </span>
        </button>
      )}

      {isOpen && (
        <div className="
          fixed z-50 
          bottom-0 right-0 left-0 top-16
          sm:bottom-4 sm:right-4 sm:left-auto sm:top-auto
          sm:w-[380px] sm:h-[600px] sm:max-h-[calc(100vh-2rem)]
          bg-white dark:bg-gray-900 
          rounded-t-3xl sm:rounded-3xl 
          shadow-2xl 
          border border-gray-200 dark:border-gray-800 
          flex flex-col overflow-hidden 
          animate-[chatSlideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]
        ">
          {/* Header */}
          <div className="relative p-3 sm:p-4 bg-gradient-to-br from-brand-500 to-purple-600 text-white flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm sm:text-base truncate">ជំនួយការ EduMatch</h3>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                សកម្ម
              </p>
            </div>

            <button
              onClick={startNewChat}
              className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white flex-shrink-0"
              title="ការសន្ទនាថ្មី"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white flex-shrink-0"
              aria-label="Close chat"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {currentSchoolId && (
            <div className="px-3 sm:px-4 py-2 text-xs bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center gap-2 flex-shrink-0">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="break-words">កំពុងផ្តោតលើសាលានេះ</span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50 dark:bg-gray-950 min-h-0">
            {messages.map((msg) => (
              <Message key={msg.id} msg={msg} />
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-[bounce_1s_infinite_0ms]" />
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-[bounce_1s_infinite_150ms]" />
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-[bounce_1s_infinite_300ms]" />
                  </div>
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && !conversationId && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 px-2">សំណួរស្នើនែ:</p>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(s)
                      setTimeout(() => sendMessage(), 50)
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:border-brand-400 hover:shadow-md transition-all break-words"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 sm:p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
            <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-brand-500 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="សួរអ្វីមួយ..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-900 dark:text-white placeholder-gray-400 px-2 py-1.5 max-h-24 min-w-0"
                style={{ overflow: 'hidden' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex-shrink-0 bg-gradient-to-br from-brand-500 to-purple-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Send"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}


/* Message Component - shows text with blinking cursor while streaming */
function Message({ msg }) {
  const isUser = msg.role === 'user'
  const isError = msg.error

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words
        ${isUser
          ? 'bg-gradient-to-br from-brand-500 to-purple-600 text-white rounded-br-sm'
          : isError
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-bl-sm'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm shadow-sm'
        }
      `}>
        {msg.text}
        {msg.streaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm align-middle" />
        )}
      </div>
    </div>
  )
}