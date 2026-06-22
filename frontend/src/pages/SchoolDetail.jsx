import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import FavoriteButton from '../components/FavoriteButton'


export default function SchoolDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [school, setSchool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favCount, setFavCount] = useState(0)

  useEffect(() => {
    setLoading(true)
    api.get(`/schools/${id}`)
      .then(res => setSchool(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    api.get(`/favorites/check/${id}`)
      .then(res => setFavCount(res.data.favorite_count))
      .catch(() => {})
  }, [id])

  const backLink = user ? "/schools" : "/"
  const backText = "Back to home"

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading school details...</p>
      </div>
    )
  }

  if (error || !school) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'School not found'}</p>
        <Link to={backLink} className="text-brand-600 dark:text-brand-400 hover:underline">
          {backText}
        </Link>
      </div>
    )
  }

  const initial = school.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Back link */}
      <Link
        to={backLink}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-4 sm:mb-6"
      >
        ← {backText}
      </Link>

      {/* Hero card */}
      <div className="
        bg-white dark:bg-gray-900
        border border-gray-100 dark:border-gray-800
        rounded-2xl sm:rounded-3xl shadow-md overflow-hidden mb-6
      ">
        {/* Hero image */}
        <div className="h-32 sm:h-48 relative overflow-hidden">
          {school.image_url ? (
            <>
              <img
                src={school.image_url}
                alt={school.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.classList.add('bg-gradient-to-r', 'from-brand-500', 'via-purple-500', 'to-pink-500')
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </>
          ) : (
            <div className="h-full bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500" />
          )}
        </div>

        <div className="px-4 sm:px-8 pb-6 sm:pb-8 -mt-10 sm:-mt-12 relative">
          {/* Logo */}
          <div className="
            w-20 h-20 sm:w-24 sm:h-24 rounded-2xl
            bg-white dark:bg-gray-100
            flex items-center justify-center
            text-3xl sm:text-4xl font-bold text-brand-600
            shadow-xl border-4 border-white dark:border-gray-900
            overflow-hidden p-2
          ">
            {school.logo_url ? (
              <img
                src={school.logo_url}
                alt={school.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = initial
                }}
              />
            ) : (
              initial
            )}
          </div>

          <div className="flex items-start justify-between gap-3 mt-4 mb-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white break-words flex-1 min-w-0 leading-tight">
              {school.name}
            </h1>
            {user && (
              <FavoriteButton
                schoolId={school.id}
                size="lg"
                onChange={(newCount) => setFavCount(newCount)}
              />
            )}
          </div>
          
          {school.type && (
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 break-words">
              {school.type}
            </p>
          )}

          {/* Popularity badge */}
          {favCount > 0 && (
            <div className="mt-3">
              <span className="
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                bg-red-50 dark:bg-red-900/20
                text-red-600 dark:text-red-400
                text-xs font-medium
              ">
                <HeartFilledIcon />
                {favCount} {favCount === 1 ? 'សិស្ស' : 'សិស្ស'}បានបន្ថែម
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {school.region && <InfoPill icon={<PinIcon />} text={school.region} />}
            {school.address && <InfoPill icon={<HouseIcon />} text={school.address} />}
            {school.phones?.length > 0 && <InfoPill icon={<PhoneIcon />} text={school.phones.join(', ')} />}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <StatCard label="Departments" value={school.total_departments} color="brand" />
        <StatCard label="Majors" value={school.total_majors} color="purple" />
        <StatCard label="Scholarships" value={school.total_scholarships} color="amber" />
      </div>

      {/* Scholarships */}
      {school.scholarships.length > 0 && (
        <div className="
          bg-white dark:bg-gray-900
          border border-gray-100 dark:border-gray-800
          rounded-2xl shadow-md p-4 sm:p-6 mb-6
        ">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
            Scholarships
          </h2>
          <div className="space-y-3">
            {school.scholarships.map(s => (
              <ScholarshipCard key={s.id} scholarship={s} />
            ))}
          </div>
        </div>
      )}

      {/* Departments + majors */}
      <div className="
        bg-white dark:bg-gray-900
        border border-gray-100 dark:border-gray-800
        rounded-2xl shadow-md p-4 sm:p-6
      ">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
          Departments & Majors
        </h2>
        <div className="space-y-4">
          {school.departments.map(d => (
            <DepartmentBlock key={d.id} department={d} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="
        mt-6 sm:mt-8 p-5 sm:p-6 rounded-2xl text-center
        bg-gradient-to-r from-brand-500 to-purple-500
        text-white
      ">
        <h3 className="text-lg sm:text-xl font-bold mb-2">ចង់សិក្សានៅទីនេះ?</h3>
        <p className="text-sm sm:text-base text-white/90 mb-4">
          ធ្វើការតេស្តដើម្បីស្វែងរកសាលាណាដែលស្រដៀងចំណង់ចំណូលចិត្តរបស់អ្នក
        </p>
        <Link
          to={user ? "/survey" : "/login"}
          className="
            inline-block px-6 py-3 bg-white text-brand-600
            font-semibold rounded-full
            hover:bg-gray-100 transition
          "
        >
          {user ? 'ធ្វើការតេស្ត' : 'ចូលគណនី'}
        </Link>
      </div>
    </div>
  )
}


/* Helper components */

function InfoPill({ icon, text }) {
  return (
    <div className="
      inline-flex items-start gap-2 px-3 py-1.5 rounded-2xl
      bg-gray-100 dark:bg-gray-800
      text-xs sm:text-sm text-gray-700 dark:text-gray-300
      max-w-full
    ">
      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5">{icon}</span>
      <span className="break-words min-w-0">{text}</span>
    </div>
  )
}

function StatCard({ label, value, color }) {
  const colors = {
    brand: 'from-brand-500 to-brand-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
  }
  return (
    <div className="
      bg-white dark:bg-gray-900
      border border-gray-100 dark:border-gray-800
      rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-5 text-center
    ">
      <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent`}>
        {value}
      </div>
      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 break-words">{label}</div>
    </div>
  )
}


function ScholarshipCard({ scholarship }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="
          w-full text-left
          rounded-2xl overflow-hidden
          bg-gradient-to-r from-amber-50 to-orange-50
          dark:from-amber-900/20 dark:to-orange-900/20
          border border-amber-200 dark:border-amber-800
          hover:shadow-xl hover:scale-[1.01]
          transition-all duration-200
          group
        "
      >
        <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5">
          <div className="
            w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0
            bg-white dark:bg-gray-900 shadow-sm
          ">
            <div className="text-xl sm:text-2xl font-bold text-amber-600">
              {scholarship.coverage_percentage || 0}%
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base break-words">
              {scholarship.name}
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
              {scholarship.academic_year} · {scholarship.category}
            </p>

            {scholarship.total_scholarships && (
              <div className="mt-3">
                <span className="
                  inline-flex items-center px-3 py-1 rounded-full
                  bg-amber-100 dark:bg-amber-500/20
                  text-amber-800 dark:text-amber-300
                  text-xs font-semibold
                ">
                  {scholarship.total_scholarships} កន្លែងសរុប
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="
          w-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium
          text-amber-700 dark:text-amber-400
          border-t border-amber-200 dark:border-amber-800
          flex items-center justify-center gap-2
          group-hover:bg-amber-100/50 dark:group-hover:bg-amber-900/30
          transition
        ">
          មើលព័ត៌មានបន្ថែម
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </button>

      {showModal && (
        <ScholarshipModal
          scholarship={scholarship}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}


function ScholarshipModal({ scholarship, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="
        fixed inset-0 z-50
        bg-black/60 backdrop-blur-sm
        flex items-center justify-center
        p-3 sm:p-4
        animate-[fadeIn_0.2s_ease-out]
      "
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full max-w-2xl
          bg-white dark:bg-gray-900
          rounded-2xl shadow-2xl
          animate-[slideUp_0.3s_ease-out]
          overflow-hidden
          flex flex-col
          max-h-[90vh]
        "
      >
        <div className="
          p-4 sm:p-6 flex-shrink-0
          bg-gradient-to-br from-amber-50 to-orange-50
          dark:from-[#1a0f0a] dark:to-[#2a1810]
        ">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="
              w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center flex-shrink-0
              bg-white dark:bg-[#2a1810]
              border border-amber-200 dark:border-amber-500/30
              shadow-lg
            ">
              <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
                {scholarship.coverage_percentage || 0}%
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-xl font-bold mb-1 text-amber-900 dark:text-amber-100 break-words">
                {scholarship.name}
              </h2>
              <div className="text-xs sm:text-sm text-amber-700 dark:text-amber-300/80 break-words">
                {scholarship.academic_year} · {scholarship.category}
              </div>
            </div>
          </div>
        </div>

        <div className="
          p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1
          hide-scrollbar
        ">
          {scholarship.total_scholarships && (
            <div className="
              p-3 sm:p-4 rounded-xl text-center
              bg-amber-50 dark:bg-amber-900/20
              border border-amber-200 dark:border-amber-800
            ">
              <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
                {scholarship.total_scholarships}
              </div>
              <div className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mt-1">
                កន្លែងសរុបអាហារូបករណ៍
              </div>
            </div>
          )}

          {(scholarship.quota_general != null || scholarship.quota_female != null ||
            scholarship.quota_poor != null || scholarship.quota_remote != null) && (
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
                ការបែងចែកកោតា
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {scholarship.quota_general != null && (
                  <NeutralPill label="ទូទៅ" value={scholarship.quota_general} big />
                )}
                {scholarship.quota_female != null && (
                  <NeutralPill label="ស្ត្រី" value={scholarship.quota_female} big />
                )}
                {scholarship.quota_poor != null && (
                  <NeutralPill label="ក្រីក្រ" value={scholarship.quota_poor} big />
                )}
                {scholarship.quota_remote != null && (
                  <NeutralPill label="ដាច់ស្រយាល" value={scholarship.quota_remote} big />
                )}
              </div>
            </div>
          )}

          {scholarship.eligibility_criteria?.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
                លក្ខខណ្ឌ
              </h3>
              <ul className="space-y-2">
                {scholarship.eligibility_criteria.map((c, i) => (
                  <li key={i} className="
                    flex items-start gap-3 p-3 rounded-lg
                    bg-gray-50 dark:bg-gray-800
                  ">
                    <span className="
                      w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                      bg-amber-500 text-white text-xs font-bold
                    ">
                      {i + 1}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-words min-w-0">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scholarship.majors?.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
                មុខវិជ្ជា ({scholarship.majors.length})
              </h3>
              <div className="space-y-2">
                {scholarship.majors.map((m, i) => (
                  <div key={i} className="
                    p-3 rounded-lg
                    bg-gray-50 dark:bg-gray-800
                    border border-gray-200 dark:border-gray-700
                  ">
                    <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                      <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white break-words min-w-0 flex-1">
                        {m.name}
                      </span>
                      {m.total_quota != null && (
                        <span className="
                          flex-shrink-0 px-2 py-0.5 rounded-full
                          bg-amber-100 dark:bg-amber-500/20
                          text-amber-800 dark:text-amber-300
                          text-xs font-bold whitespace-nowrap
                        ">
                          {m.total_quota} កន្លែង
                        </span>
                      )}
                    </div>

                    {(m.general != null || m.female != null || m.poor != null || m.remote != null) && (
                      <div className="grid grid-cols-4 gap-1.5 mt-2">
                        {m.general != null && <MiniPill label="ទូទៅ" value={m.general} />}
                        {m.female != null && <MiniPill label="ស្ត្រី" value={m.female} />}
                        {m.poor != null && <MiniPill label="ក្រីក្រ" value={m.poor} />}
                        {m.remote != null && <MiniPill label="ដាច់ស្រយាល" value={m.remote} />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="
          p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800
          bg-gray-50 dark:bg-gray-900/50
          flex-shrink-0
        ">
          <button
            onClick={onClose}
            className="
              w-full py-3 rounded-xl font-semibold text-sm sm:text-base
              bg-gradient-to-br from-amber-100 to-orange-100
              dark:from-[#1a0f0a] dark:to-[#2a1810]
              text-amber-800 dark:text-amber-400
              border border-amber-200 dark:border-amber-500/30
              hover:from-amber-200 hover:to-orange-200
              dark:hover:from-[#2a1810] dark:hover:to-[#3a2418]
              hover:text-amber-900 dark:hover:text-amber-300
              transition shadow-md
            "
          >
            បិទ
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}


function NeutralPill({ label, value, big = false }) {
  return (
    <div className="
      px-2 py-2 rounded-lg text-center
      bg-gray-50 dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      text-gray-900 dark:text-white
    ">
      <div className={big ? "text-lg sm:text-2xl font-bold" : "text-sm sm:text-base font-bold"}>
        {value}
      </div>
      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 break-words">
        {label}
      </div>
    </div>
  )
}


function MiniPill({ label, value }) {
  return (
    <div className="
      text-center px-1 py-1 rounded
      bg-white dark:bg-gray-900
    ">
      <div className="text-xs font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-[9px] text-gray-500 dark:text-gray-400 break-words">{label}</div>
    </div>
  )
}


function DepartmentBlock({ department }) {
  return (
    <div className="
      p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800
      bg-gray-50 dark:bg-gray-800/30
    ">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base break-words">
        {department.name}
      </h4>
      <div className="flex flex-wrap gap-2">
        {department.majors.map(m => (
          <span
            key={m.id}
            className="
              px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm
              bg-white dark:bg-gray-900
              border border-gray-200 dark:border-gray-700
              text-gray-700 dark:text-gray-300
              break-words max-w-full
            "
          >
            {m.name}
          </span>
        ))}
      </div>
    </div>
  )
}


/* SVG icons */

function PinIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function HouseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}

function HeartFilledIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}