import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import UserMenu from './UserMenu'
import ReportModal from './ReportModal'

export default function Navbar() {
  const { user } = useAuth()
  const [showReport, setShowReport] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      <nav className="
        bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl
        border-b border-gray-200 dark:border-gray-800
        sticky top-0 z-50 transition-colors
      ">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          {/* LEFT: Logo + Desktop Links */}
          <div className="flex items-center gap-3 lg:gap-10 min-w-0 flex-shrink">
            <Link to={user ? "/schools" : "/"} className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 min-w-0">
              <div className="
                w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0
                bg-gradient-to-br from-brand-500 to-purple-600
                shadow-lg shadow-brand-500/30
                p-1 sm:p-1.5
              ">
                <img
                  src="/edumatch-logo.png"
                  alt="EduMatch"
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </div>
              <span className="hidden xs:inline text-base sm:text-xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap truncate">
                EduMatch
              </span>
            </Link>

            {/* DESKTOP NAV LINKS */}
            <div className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  <Link
                    to="/schools"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition whitespace-nowrap"
                  >
                    សាលា
                  </Link>
                  <Link
                    to="/survey"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition whitespace-nowrap"
                  >
                    ស្វែងរក
                  </Link>
                  <Link
                    to="/about"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition whitespace-nowrap"
                  >
                    អំពីយើង
                  </Link>
                  {!user.is_admin && (
                    <button
                      onClick={() => setShowReport(true)}
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition whitespace-nowrap"
                    >
                      មានបញ្ហា?
                    </button>
                  )}
                  {user.is_admin && (
                    <Link
                      to="/admin"
                      className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition flex items-center gap-1 whitespace-nowrap"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition whitespace-nowrap"
                  >
                    ទំព័រដើម
                  </Link>
                  <Link
                    to="/about"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition whitespace-nowrap"
                  >
                    អំពីយើង
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
            {user ? (
              <>
                <UserMenu />
                <ThemeToggle />
                {/* HAMBURGER (logged in) */}
                <div className="md:hidden relative" ref={menuRef}>
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition flex-shrink-0"
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>

                  {/* DROPDOWN (logged in) */}
                  {mobileMenuOpen && (
                    <div className="
                      absolute right-0 mt-2 w-56
                      bg-white dark:bg-gray-900
                      border border-gray-200 dark:border-gray-800
                      rounded-xl shadow-xl
                      py-2 z-50
                      animate-[fadeIn_0.15s_ease-out]
                    ">
                      <Link
                        to="/schools"
                        onClick={closeMobileMenu}
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        សាលា
                      </Link>
                      <Link
                        to="/survey"
                        onClick={closeMobileMenu}
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        ស្វែងរក
                      </Link>
                      <Link
                        to="/about"
                        onClick={closeMobileMenu}
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        អំពីយើង
                      </Link>
                      {!user.is_admin && (
                        <>
                          <div className="my-1 h-px bg-gray-200 dark:bg-gray-800" />
                          <button
                            onClick={() => {
                              closeMobileMenu()
                              setShowReport(true)
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            មានបញ្ហា?
                          </button>
                        </>
                      )}
                      {user.is_admin && (
                        <>
                          <div className="my-1 h-px bg-gray-200 dark:bg-gray-800" />
                          <Link
                            to="/admin"
                            onClick={closeMobileMenu}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            Admin
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden xs:block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 whitespace-nowrap px-1 sm:px-2"
                >
                  ចូល
                </Link>
                <Link
                  to="/register"
                  className="
                    px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm font-semibold rounded-full text-white
                    bg-gradient-to-r from-brand-500 to-purple-500
                    hover:from-brand-600 hover:to-purple-600
                    shadow-lg shadow-brand-500/30
                    whitespace-nowrap
                  "
                >
                  ចុះឈ្មោះ
                </Link>
                <ThemeToggle />
                {/* HAMBURGER (not logged in) */}
                <div className="md:hidden relative" ref={menuRef}>
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition flex-shrink-0"
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>

                  {/* DROPDOWN (not logged in) */}
                  {mobileMenuOpen && (
                    <div className="
                      absolute right-0 mt-2 w-56
                      bg-white dark:bg-gray-900
                      border border-gray-200 dark:border-gray-800
                      rounded-xl shadow-xl
                      py-2 z-50
                      animate-[fadeIn_0.15s_ease-out]
                    ">
                      <Link
                        to="/"
                        onClick={closeMobileMenu}
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        ទំព័រដើម
                      </Link>
                      <Link
                        to="/about"
                        onClick={closeMobileMenu}
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        អំពីយើង
                      </Link>
                      <div className="my-1 h-px bg-gray-200 dark:bg-gray-800" />
                      <Link
                        to="/login"
                        onClick={closeMobileMenu}
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        ចូល
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {showReport && <ReportModal onClose={() => setShowReport(false)} />}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}