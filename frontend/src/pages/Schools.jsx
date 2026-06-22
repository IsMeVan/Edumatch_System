import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import FavoriteButton from '../components/FavoriteButton'


export default function Schools() {
  const [data, setData] = useState({ schools: [], regions: [], types: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [schoolType, setSchoolType] = useState('')
  const [hasScholarship, setHasScholarship] = useState(false)

  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    loadSchools()
  }, [search, region, schoolType, hasScholarship])

  const loadSchools = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (region) params.append('region', region)
      if (schoolType) params.append('school_type', schoolType)
      if (hasScholarship) params.append('has_scholarship', 'true')

      const res = await api.get(`/schools/?${params.toString()}`)
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!search || search.trim().length < 1) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/schools/suggest/?q=${encodeURIComponent(search)}`)
        setSuggestions(res.data.suggestions || [])
      } catch (err) {
        setSuggestions([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Logo strip — uses real DB data */}
      <LogoSlider />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">សាលា</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {data.total} គ្រឹះស្ថានសិក្សា
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md p-4 mb-6 flex flex-wrap gap-3">
        <div ref={searchRef} className="relative flex-1 min-w-[240px]">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-400 focus-within:shadow-md">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="ស្វែងរកសាលា..."
              className="bg-transparent outline-none flex-1 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => { setSearch(''); setSuggestions([]) }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl max-h-96 overflow-y-auto animate-[smoothFadeIn_0.25s_cubic-bezier(0.16,1,0.3,1)] origin-top">
              {suggestions.map((s) => (
                <SuggestionItem key={s.id} school={s} query={search} onClick={() => setShowSuggestions(false)} />
              ))}
            </div>
          )}

          <style>{`
            @keyframes smoothFadeIn {
              from { opacity: 0; transform: translateY(-8px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-brand-500 transition-all duration-200 min-w-[180px]"
        >
          <option value="">តំបន់ទាំងអស់</option>
          {data.regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          value={schoolType}
          onChange={(e) => setSchoolType(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-brand-500 transition-all duration-200 min-w-[200px]"
        >
          <option value="">ប្រភេទទាំងអស់</option>
          {data.types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <button
          onClick={() => setHasScholarship(!hasScholarship)}
          className={`
            px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all duration-200 border
            ${hasScholarship
              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-md'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-300'
            }
          `}
        >
          <CapIcon />
          មានអាហារូបករណ៍
        </button>

        {(search || region || schoolType || hasScholarship) && (
          <button
            onClick={() => { setSearch(''); setRegion(''); setSchoolType(''); setHasScholarship(false) }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
          >
            សម្អាត
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading schools...</p>
        </div>
      ) : data.schools.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No schools match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.schools.map(s => (
            <SchoolListCard key={s.id} school={s} />
          ))}
        </div>
      )}
    </div>
  )
}


/* ─── Logo Slider — Top 10 Cambodia schools, slower scroll ─── */
function LogoSlider() {
  const [logos, setLogos] = useState([])

  useEffect(() => {
    // Top 10 curated schools
    const topSchoolIds = [1, 9, 4, 5, 6, 14, 18, 30, 38, 56]
    // RUPP, ITC, NUM, UHS, RUFA, CADT, Norton, Puthisastra, AUPP, SBKU
    
    Promise.all(
      topSchoolIds.map(id => 
        api.get(`/schools/${id}`).catch(() => null)
      )
    ).then(results => {
      const schools = results
        .filter(r => r !== null && r.data.logo_url)
        .map(r => ({
          id: r.data.id,
          name: r.data.name,
          logo_url: r.data.logo_url,
        }))
      setLogos(schools)
    }).catch(() => {})
  }, [])

  if (logos.length === 0) return null

  return (
    <div className="relative overflow-hidden mb-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl py-6">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-gray-50 dark:from-gray-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-gray-50 dark:from-gray-950 to-transparent z-10 pointer-events-none" />

      <div className="flex animate-infinite-scroll">
        <div className="flex gap-12 px-6 flex-shrink-0">
          {[...logos, ...logos, ...logos].map((item, i) => (
            <LogoItem key={`a-${i}`} item={item} />
          ))}
        </div>
        <div className="flex gap-12 px-6 flex-shrink-0" aria-hidden="true">
          {[...logos, ...logos, ...logos].map((item, i) => (
            <LogoItem key={`b-${i}`} item={item} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes infinite-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-infinite-scroll {
          animation: infinite-scroll 80s linear infinite;
          width: max-content;
        }
        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}


function LogoItem({ item }) {
  return (
    <Link to={`/school/${item.id}`} className="flex items-center gap-3 hover:opacity-80 transition flex-shrink-0">
      <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md flex-shrink-0">
        <img
          src={item.logo_url}
          alt={item.name}
          className="w-full h-full object-contain"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      </div>
      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[200px] truncate">
        {item.name}
      </span>
    </Link>
  )
}


function SuggestionItem({ school, query, onClick }) {
  const highlightMatch = (text, q) => {
    if (!q) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-bold text-brand-600 dark:text-brand-400">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    )
  }

  return (
    <Link
      to={`/school/${school.id}`}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 hover:pl-5 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all duration-200 ease-out"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white dark:bg-gray-100 p-1 overflow-hidden border border-gray-200">
        {school.logo_url ? (
          <img src={school.logo_url} alt={school.name} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-500 to-purple-500 rounded text-white font-bold flex items-center justify-center">
            {school.name?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {highlightMatch(school.name, query)}
        </div>
        {school.region && (
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {school.region}
          </div>
        )}
      </div>
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}


/* ─── School Card — uses real logo ─── */
function SchoolListCard({ school }) {
  const initial = school.name?.charAt(0)?.toUpperCase() || 'U'
  const isPublic = school.type?.includes('សាធារណៈ')

  return (
    <Link
      to={`/school/${school.id}`}
      className="group block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md p-5 hover:shadow-xl hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-200 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-3">
        {school.logo_url ? (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-white dark:bg-gray-100 p-1.5 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <img
              src={school.logo_url}
              alt={school.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = `<span class="text-2xl font-bold text-gray-700">${initial}</span>`
              }}
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-500 to-purple-500 text-white text-2xl font-bold flex-shrink-0">
            {initial}
          </div>
        )}

        <div className="flex items-center gap-2">
          <FavoriteButton schoolId={school.id} size="sm" />
          <span className={`
            px-2.5 py-1 rounded-full text-xs font-semibold
            ${isPublic
              ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
              : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
            }
          `}>
            {isPublic ? 'សាធារណៈ' : 'ឯកជន'}
          </span>
        </div>
      </div>

      <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 min-h-[3rem]">
        {school.name}
      </h3>

      {school.region && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {school.region}
        </p>
      )}

      <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
        <Stat label="ផ្នែក" value={school.departments} />
        <Stat label="មុខវិជ្ជា" value={school.majors} />
        <Stat label="អាហារូបករណ៍" value={school.scholarships} highlight={school.scholarships > 0} />
      </div>
    </Link>
  )
}


function Stat({ label, value, highlight = false }) {
  return (
    <div>
      <div className={`text-base font-bold ${highlight ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide">{label}</div>
    </div>
  )
}


function CapIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  )
}