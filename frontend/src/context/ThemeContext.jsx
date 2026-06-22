import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

// Get the localStorage key for current user (so each user has their own theme)
function getThemeKey() {
  try {
    const userStr = sessionStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      return `theme_user_${user.id}`
    }
  } catch (e) {
    // Fallback if user data is corrupted
  }
  return 'theme_guest'
}

function getInitialTheme() {
  const key = getThemeKey()
  const saved = localStorage.getItem(key)
  if (saved) return saved
  // Default: follow system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  // Apply theme to <html> tag and save to per-user storage
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Save under per-user key
    const key = getThemeKey()
    localStorage.setItem(key, theme)
  }, [theme])

  // Listen for user changes (login/logout) and reload theme
  useEffect(() => {
    const handleUserChange = () => {
      const key = getThemeKey()
      const saved = localStorage.getItem(key)
      if (saved) {
        setTheme(saved)
      } else {
        // No saved theme for this user yet - use system preference
        setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      }
    }

    window.addEventListener('user-changed', handleUserChange)
    return () => window.removeEventListener('user-changed', handleUserChange)
  }, [])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)