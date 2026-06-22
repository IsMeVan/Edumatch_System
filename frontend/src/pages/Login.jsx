import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1. Login to get token
      const res = await api.post('/auth/login', { email, password })
      const token = res.data.token

      // 2. Save token to sessionStorage so axios interceptor can use it
      sessionStorage.setItem('token', token)

      // 3. Fetch FULL profile (including avatar_url)
      const profileRes = await api.get('/users/me')

      // 4. Set the COMPLETE user data in context
      login(token, profileRes.data)

      navigate('/schools')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="
          bg-white dark:bg-gray-900
          border border-gray-100 dark:border-gray-800
          rounded-2xl shadow-xl p-8
        ">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to find your perfect university</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full px-4 py-2.5 rounded-lg outline-none
                  bg-white dark:bg-gray-800
                  border border-gray-300 dark:border-gray-700
                  text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-brand-500 focus:border-transparent
                "
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full px-4 py-2.5 rounded-lg outline-none
                  bg-white dark:bg-gray-800
                  border border-gray-300 dark:border-gray-700
                  text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-brand-500 focus:border-transparent
                "
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 dark:text-brand-500 hover:text-brand-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}