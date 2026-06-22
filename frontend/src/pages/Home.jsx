import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Home() {
  const { user } = useAuth()
  const [topSchools, setTopSchools] = useState([])

  useEffect(() => {
    const ids = [1, 9, 4]
    Promise.all(
      ids.map(id => api.get(`/schools/${id}`).catch(() => null))
    ).then(results => {
      const schools = results
        .filter(r => r !== null)
        .map(r => r.data)
      setTopSchools(schools)
    })
  }, [])

  return (
    <div className="relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'radial-gradient(rgba(156, 163, 175, 0.12) 2px, transparent 2px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] max-w-[1200px] max-h-[1200px] bg-fuchsia-500/20 dark:bg-fuchsia-600/15 rounded-full blur-[150px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] max-w-[1200px] max-h-[1200px] bg-rose-500/20 dark:bg-rose-600/15 rounded-full blur-[150px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-[pulse_10s_ease-in-out_infinite]" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[80vw] h-[30vw] max-w-[1400px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/70 to-gray-50 dark:via-[#0d040f]/70 dark:to-[#0d040f] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          {/* LEFT: Hero text */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-fuchsia-100 dark:bg-fuchsia-500/10 border border-fuchsia-200 dark:border-fuchsia-500/20 mb-4 sm:mb-6">
              <span className="w-2 h-2 rounded-full bg-fuchsia-600 dark:bg-fuchsia-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-fuchsia-700 dark:text-fuchsia-300">
                ប្រព័ន្ធណែនាំគ្រឹះស្ថានសិក្សា
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[7rem] font-bold text-gray-900 dark:text-white leading-[1.1] mb-6 sm:mb-8 tracking-tight break-words">
              រកគ្រឹះស្ថាន
              <br />
              <span className="bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent">
                សម្រាប់អ្នក
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 sm:mb-10 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0 break-words">
              ប្រព័ន្ធ AI ណែនាំគ្រឹះស្ថានសិក្សាដែលសមស្របបំផុត ផ្អែកលើការសិក្សា ចំណាប់អារម្មណ៍ និងគោលដៅរបស់អ្នក។ នេះគឺជាគំរូមួយចំនួននៃព័ត៌មានសាលាដែលយើងផ្តល់ជូន។ ដើម្បីដឹងបន្ថែមអំពីពួកយើង និងសេវាកម្មជាច្រើនទៀត សូមចុចពាក្យខាងក្រោម
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                to={user ? '/survey' : '/register'}
                className="group inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-semibold text-sm sm:text-base shadow-lg shadow-indigo-500/40 transition-all hover:scale-[1.02]"
              >
                ចាប់ផ្តើមរកគ្រឹះស្ថាន
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {/* RIGHT: Top 3 schools - hidden on mobile/tablet */}
          <div className="relative h-[520px] hidden lg:block">
            {topSchools[0] && (
              <SchoolCard
                school={topSchools[0]}
                shortName="RUPP"
                color="green"
                style={{ top: '12%', right: '0', animationDelay: '0s' }}
              />
            )}
            {topSchools[1] && (
              <SchoolCard
                school={topSchools[1]}
                shortName="ITC"
                color="brand"
                style={{ top: '40%', right: '8%', animationDelay: '1s' }}
              />
            )}
            {topSchools[2] && (
              <SchoolCard
                school={topSchools[2]}
                shortName="NUM"
                color="amber"
                style={{ top: '68%', right: '2%', animationDelay: '2s' }}
              />
            )}
          </div>

          {/* MOBILE/TABLET: Stacked schools */}
          <div className="lg:hidden space-y-3">
            {topSchools[0] && (
              <SchoolCardMobile
                school={topSchools[0]}
                shortName="RUPP"
                color="green"
              />
            )}
            {topSchools[1] && (
              <SchoolCardMobile
                school={topSchools[1]}
                shortName="ITC"
                color="brand"
              />
            )}
            {topSchools[2] && (
              <SchoolCardMobile
                school={topSchools[2]}
                shortName="NUM"
                color="amber"
              />
            )}
          </div>
        </div>

        {/* Stats - 2 cols mobile, 4 cols desktop */}
        <div className="mt-10 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 px-3 sm:px-6 lg:px-8 py-5 sm:py-6 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur border border-gray-200 dark:border-gray-800 shadow-md">
          <StatCard
            icon={<GraduationIcon />}
            iconBg="bg-brand-100 dark:bg-brand-500/20"
            iconColor="text-brand-600 dark:text-brand-400"
            number="100+"
            label="សាកលវិទ្យាល័យ និងសាលាឧត្តមសិក្សា"
          />
          <StatCard
            icon={<SparkleIcon />}
            iconBg="bg-purple-100 dark:bg-purple-500/20"
            iconColor="text-purple-600 dark:text-purple-400"
            number="AI"
            label="បច្ចេកវិទ្យាផ្នែកវិភាគ"
          />
          <StatCard
            icon={<ShieldIcon />}
            iconBg="bg-green-100 dark:bg-green-500/20"
            iconColor="text-green-600 dark:text-green-400"
            number="100%"
            label="ទិន្នន័យត្រឹមត្រូវ និងសុវត្ថិភាព"
          />
          <StatCard
            icon={<UsersIcon />}
            iconBg="bg-orange-100 dark:bg-orange-500/20"
            iconColor="text-orange-600 dark:text-orange-400"
            number="1K+"
            label="អ្នកប្រើប្រាស់​"
          />
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .float-anim { animation: float 4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}


function StatCard({ icon, iconBg, iconColor, number, label }) {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 lg:gap-4 text-center sm:text-left">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{number}</div>
        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight break-words">{label}</div>
      </div>
    </div>
  )
}


// DESKTOP: Floating animated cards
function SchoolCard({ school, shortName, color, style }) {
  const matchColors = {
    green: 'text-blue-600 dark:text-blue-400',
    brand: 'text-blue-600 dark:text-blue-400',
    amber: 'text-blue-600 dark:text-blue-400',
  }

  return (
    <Link
      to={`/school/${school.id}`}
      className="absolute float-anim group cursor-pointer"
      style={style}
    >
      <div className="relative flex items-center gap-4 px-5 py-4 pr-10 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-xl shadow-black/5 dark:shadow-black/30 min-w-[320px] transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:border-brand-300 dark:group-hover:border-brand-700">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white dark:bg-gray-100 p-1.5 flex-shrink-0 overflow-hidden">
          {school.logo_url ? (
            <img
              src={school.logo_url}
              alt={shortName}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = `<span class="text-xl font-bold text-gray-700">${shortName}</span>`
              }}
            />
          ) : (
            <span className="text-xl font-bold text-gray-700">{shortName}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {school.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{shortName}</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className={`text-sm font-bold ${matchColors[color]}`}>ស្វែងយល់</span>
          </div>
        </div>

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
          →
        </span>
      </div>
    </Link>
  )
}


// MOBILE: Static stacked cards
function SchoolCardMobile({ school, shortName, color }) {
  const matchColors = {
    green: 'text-blue-600 dark:text-blue-400',
    brand: 'text-blue-600 dark:text-blue-400',
    amber: 'text-blue-600 dark:text-blue-400',
  }

  return (
    <Link
      to={`/school/${school.id}`}
      className="block group"
    >
      <div className="relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-lg transition-all duration-300 active:scale-[0.98] hover:border-brand-300 dark:hover:border-brand-700">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-white dark:bg-gray-100 p-1.5 flex-shrink-0 overflow-hidden">
          {school.logo_url ? (
            <img
              src={school.logo_url}
              alt={shortName}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = `<span class="text-lg font-bold text-gray-700">${shortName}</span>`
              }}
            />
          ) : (
            <span className="text-lg font-bold text-gray-700">{shortName}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm break-words line-clamp-2">
            {school.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{shortName}</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className={`text-xs sm:text-sm font-bold ${matchColors[color]}`}>ស្វែងយល់</span>
          </div>
        </div>

        <span className="text-gray-400 dark:text-gray-500 text-lg flex-shrink-0">→</span>
      </div>
    </Link>
  )
}


function GraduationIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  )
}
function SparkleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}