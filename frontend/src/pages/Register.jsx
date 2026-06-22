import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Register() {
  // STEP 1: Registration form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // STEP 2: OTP verification
  const [step, setStep] = useState(1)  // 1 = register form, 2 = OTP input
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const otpRefs = useRef([])

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // STEP 1: Submit registration form
  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    
    try {
      const res = await api.post('/auth/register', { name, email, password })
      
      // Move to OTP verification step
      setSuccess(res.data.message || 'Verification code sent to your email')
      setStep(2)
      setResendCooldown(60)  // 60 seconds before allowing resend
      
      // Focus first OTP input
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace to go to previous input
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste of full OTP
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pasted)) {
      const newOtp = pasted.split('')
      setOtp(newOtp)
      otpRefs.current[5]?.focus()
    }
  }

  // STEP 2: Submit OTP code
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits')
      setLoading(false)
      return
    }
    
    try {
      const res = await api.post('/auth/verify-otp', { 
        email, 
        otp_code: otpCode 
      })
      
      // Success - auto login and go to dashboard
      login(res.data.token, res.data.user)
      navigate('/schools')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid code')
      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP code
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return
    
    setResending(true)
    setError('')
    
    try {
      await api.post('/auth/resend-otp', { email })
      setSuccess('New code sent to your email')
      setOtp(['', '', '', '', '', ''])
      setResendCooldown(60)
      otpRefs.current[0]?.focus()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  // Go back to step 1
  const handleBack = () => {
    setStep(1)
    setOtp(['', '', '', '', '', ''])
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-md">
        <div className="
          bg-white dark:bg-gray-900
          border border-gray-100 dark:border-gray-800
          rounded-2xl shadow-xl p-6 sm:p-8
        ">
          {/* STEP 1: REGISTRATION FORM */}
          {step === 1 && (
            <>
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Create account
                </h1>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 break-words">
                  Start your journey to the right university
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg p-3 mb-4 break-words">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="
                      w-full px-4 py-2.5 rounded-lg outline-none text-sm sm:text-base
                      bg-white dark:bg-gray-800
                      border border-gray-300 dark:border-gray-700
                      text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-brand-500
                    "
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="
                      w-full px-4 py-2.5 rounded-lg outline-none text-sm sm:text-base
                      bg-white dark:bg-gray-800
                      border border-gray-300 dark:border-gray-700
                      text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-brand-500
                    "
                    placeholder="you@example.com"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    យើងនឹងផ្ញើលេខកូដផ្ទៀងផ្ទាត់ទៅអ៊ីមែលនេះ
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="
                      w-full px-4 py-2.5 rounded-lg outline-none text-sm sm:text-base
                      bg-white dark:bg-gray-800
                      border border-gray-300 dark:border-gray-700
                      text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-brand-500
                    "
                    placeholder="At least 8 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg disabled:opacity-50 transition text-sm sm:text-base"
                >
                  {loading ? 'Sending code...' : 'Sign up'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-600 dark:text-brand-500 hover:text-brand-700 font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 2 && (
            <>
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Verify your email
                </h1>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 break-words">
                  We sent a 6-digit code to
                </p>
                <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-all">
                  {email}
                </p>
              </div>

              {success && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-lg p-3 mb-4 break-words">
                  {success}
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg p-3 mb-4 break-words">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* 6 OTP digit boxes */}
                <div className="flex justify-center gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="
                        w-10 h-12 sm:w-12 sm:h-14
                        text-center text-xl sm:text-2xl font-bold
                        rounded-lg outline-none
                        bg-white dark:bg-gray-800
                        border-2 border-gray-300 dark:border-gray-700
                        text-gray-900 dark:text-white
                        focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                        transition
                      "
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg disabled:opacity-50 transition text-sm sm:text-base"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending}
                  className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {resending 
                    ? 'Sending...' 
                    : resendCooldown > 0 
                      ? `Resend code in ${resendCooldown}s` 
                      : "Didn't receive code? Resend"
                  }
                </button>

                <div>
                  <button
                    onClick={handleBack}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ← Use a different email
                  </button>
                </div>
              </div>

              <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-300 break-words">
                   The code expires in 10 minutes. Check your spam folder if you don't see it.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}