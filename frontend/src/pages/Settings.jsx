import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const API_BASE = 'http://localhost:8000'

export default function Settings() {
  const { updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('photo')
  const [profile, setProfile] = useState(null)
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [p, s] = await Promise.all([
        api.get('/users/me'),
        api.get('/history/'),
      ])
      setProfile(p.data)
      setSurveys(s.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="
          bg-white dark:bg-gray-900
          border border-gray-100 dark:border-gray-800
          rounded-2xl shadow-md p-3
          h-fit
        ">
          <nav className="space-y-1">
            <SidebarItem
              icon={<CameraIcon />}
              label="រូបភាព"
              active={activeTab === 'photo'}
              onClick={() => setActiveTab('photo')}
            />
            <SidebarItem
              icon={<UserIcon />}
              label="ឈ្មោះ"
              active={activeTab === 'name'}
              onClick={() => setActiveTab('name')}
            />
            <SidebarItem
              icon={<DocIcon />}
              label="ជីវប្រវត្តិ"
              active={activeTab === 'bio'}
              onClick={() => setActiveTab('bio')}
            />
            <SidebarItem
              icon={<HistoryIcon />}
              label="ប្រវត្តិការស្ទង់មតិ"
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
            />
          </nav>
          
          {/* Link to favorites (separate, since it's a navigation, not a setting) */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Link
              to="/my-favorites"
              className="
                w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left
                text-sm font-medium
                text-gray-700 dark:text-gray-300
                hover:bg-red-50 dark:hover:bg-red-900/20
                hover:text-red-600 dark:hover:text-red-400
                transition
              "
            >
              <HeartIcon />
              <span>សាលាដែលខ្ញុំចូលចិត្ត</span>
              <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </aside>

        {/* Content area */}
        <main className="
          bg-white dark:bg-gray-900
          border border-gray-100 dark:border-gray-800
          rounded-2xl shadow-md p-8
        ">
          {activeTab === 'photo' && (
            <PhotoSection
              profile={profile}
              onUpdate={(avatarUrl) => {
                loadAll()
                if (avatarUrl) updateUser({ avatar_url: avatarUrl })
              }}
            />
          )}
          {activeTab === 'name' && (
            <NameSection
              profile={profile}
              onUpdate={(name) => {
                loadAll()
                updateUser({ name })
              }}
            />
          )}
          {activeTab === 'bio' && (
            <BioSection
              profile={profile}
              onUpdate={(bio) => {
                loadAll()
                updateUser({ bio })
              }}
            />
          )}
          {activeTab === 'history' && (
            <HistorySection surveys={surveys} onUpdate={loadAll} />
          )}
        </main>
      </div>
    </div>
  )
}


function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left
        text-sm font-medium transition
        ${active
          ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
        }
      `}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}


/* ────── Photo Section ────── */
function PhotoSection({ profile, onUpdate }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [savedMsg, setSavedMsg] = useState('')

  const initial = profile?.name?.charAt(0)?.toUpperCase() || 'U'
  const currentAvatar = profile?.avatar_url ? `${API_BASE}${profile.avatar_url}` : null
  const displayedAvatar = previewUrl || currentAvatar

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large (max 5MB)')
      return
    }
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!selectedFile) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)
    try {
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSavedMsg('រក្សាទុកជោគជ័យ!')
      setSelectedFile(null)
      setPreviewUrl(null)
      setTimeout(() => setSavedMsg(''), 2000)
      onUpdate(res.data.avatar_url)
    } catch (err) {
      alert('Failed to upload')
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">រូបភាពប្រវត្តិរូប</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        ឧបាសក PNG, JPG, ឬ WEBP (អតិបរមា 5MB)
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="
          w-32 h-32 rounded-full overflow-hidden flex-shrink-0
          bg-gradient-to-br from-brand-500 to-purple-500
          text-white text-5xl font-bold
          flex items-center justify-center
          shadow-xl
        ">
          {displayedAvatar ? (
            <img src={displayedAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>

        <div className="flex-1 space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="
              inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
              bg-brand-600 hover:bg-brand-700 text-white
              font-medium text-sm transition
              disabled:opacity-50
            "
          >
            ផ្លាស់ប្ដូររូបភាព
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFile && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              បានជ្រើសរើស: {selectedFile.name}
            </p>
          )}

          {selectedFile && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={uploading}
                className="
                  px-5 py-2.5 rounded-lg font-medium text-sm
                  bg-green-600 hover:bg-green-700 text-white
                  disabled:opacity-50 transition
                "
              >
                {uploading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
              </button>
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="
                  px-5 py-2.5 rounded-lg font-medium text-sm
                  bg-gray-200 dark:bg-gray-700
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-300 dark:hover:bg-gray-600
                  disabled:opacity-50 transition
                "
              >
                បោះបង់
              </button>
            </div>
          )}

          {savedMsg && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ {savedMsg}
            </p>
          )}

          {!selectedFile && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ការផ្លាស់ប្ដូររូបភាពនឹងបង្ហាញនៅគ្រប់ទីកន្លែង
            </p>
          )}
        </div>
      </div>
    </div>
  )
}


/* ────── Name Section ────── */
function NameSection({ profile, onUpdate }) {
  const [name, setName] = useState(profile.name || '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Name cannot be empty')
      return
    }
    setSaving(true)
    try {
      await api.put('/users/me', { name })
      setSavedMsg('រក្សាទុកជោគជ័យ!')
      setTimeout(() => setSavedMsg(''), 2000)
      onUpdate(name)
    } catch (err) {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ឈ្មោះ</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        ឈ្មោះរបស់អ្នកនឹងបង្ហាញនៅគ្រប់ទីកន្លែង
      </p>

      <div className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={150}
          className="
            w-full px-4 py-3 rounded-lg outline-none
            bg-gray-50 dark:bg-gray-800
            border border-gray-300 dark:border-gray-700
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-brand-500
          "
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || name === profile.name}
            className="
              px-5 py-2.5 rounded-lg font-medium text-sm
              bg-brand-600 hover:bg-brand-700 text-white
              disabled:opacity-40 disabled:cursor-not-allowed
              transition
            "
          >
            {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
          </button>
          {savedMsg && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ {savedMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}


/* ────── Bio Section ────── */
function BioSection({ profile, onUpdate }) {
  const [bio, setBio] = useState(profile.bio || '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/users/me', { bio })
      setSavedMsg('រក្សាទុកជោគជ័យ!')
      setTimeout(() => setSavedMsg(''), 2000)
      onUpdate(bio)
    } catch (err) {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ជីវប្រវត្តិ</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        ប្រាប់យើងបន្តិចអំពីខ្លួនអ្នក
      </p>

      <div className="space-y-4">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={6}
          placeholder="ឧ. ខ្ញុំចូលចិត្តកូដ, គណិតវិទ្យា, និងវិទ្យាសាស្ត្រ..."
          className="
            w-full px-4 py-3 rounded-lg outline-none resize-none
            bg-gray-50 dark:bg-gray-800
            border border-gray-300 dark:border-gray-700
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-brand-500
          "
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || bio === (profile.bio || '')}
            className="
              px-5 py-2.5 rounded-lg font-medium text-sm
              bg-brand-600 hover:bg-brand-700 text-white
              disabled:opacity-40 disabled:cursor-not-allowed
              transition
            "
          >
            {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
          </button>
          {savedMsg && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ {savedMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}


/* ────── History Section ────── */
function HistorySection({ surveys, onUpdate }) {
  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (surveyId) => {
    if (!confirm('Delete this survey and all its recommendations?')) return
    setDeletingId(surveyId)
    try {
      await api.delete(`/history/${surveyId}`)
      onUpdate()
    } catch (err) {
      alert('Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ប្រវត្តិការស្ទង់មតិ</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        គ្រប់គ្រង និងលុបការស្ទង់មតិពីមុនរបស់អ្នក
      </p>

      {surveys.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>មិនទាន់មានការស្ទង់មតិទេ</p>
          <Link to="/survey" className="text-brand-600 dark:text-brand-400 hover:underline mt-2 inline-block">
            ធ្វើការស្ទង់មតិដំបូងរបស់អ្នក →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map(s => {
            const date = new Date(s.submitted_at)
            const dateStr = date.toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })
            return (
              <div key={s.survey_id} className="
                flex items-center gap-3 p-4 rounded-xl
                bg-gray-50 dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
              ">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    {s.career_interest}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {dateStr} · {s.recommendation_count} matches
                  </div>
                </div>
                <Link
                  to={`/results/${s.survey_id}`}
                  className="
                    text-xs font-medium
                    text-brand-600 dark:text-brand-400
                    hover:underline px-2
                  "
                >
                  មើល
                </Link>
                <button
                  onClick={() => handleDelete(s.survey_id)}
                  disabled={deletingId === s.survey_id}
                  className="
                    text-xs font-medium px-3 py-1.5 rounded-lg
                    text-red-600 dark:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-900/20
                    disabled:opacity-50 transition
                  "
                >
                  {deletingId === s.survey_id ? 'កំពុងលុប...' : 'លុប'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


/* ────── Icons ────── */
function CameraIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
function DocIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
function HeartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}