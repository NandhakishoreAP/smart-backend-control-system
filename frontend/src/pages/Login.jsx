import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginUser } from '../api/api'

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) {
      return null
    }
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded))
  } catch (err) {
    return null
  }
}

function normalizeRole(value) {
  if (!value) {
    return ''
  }
  const normalized = value.replace(/^ROLE_/, '').toUpperCase()
  if (normalized === 'API_USER') {
    return 'API_CONSUMER'
  }
  return normalized
}

const getErrorMessage = (err) => {
  if (!err) {
    return 'Login failed.'
  }
  const data = err?.response?.data
  if (typeof data === 'string') {
    return data
  }
  if (data?.message) {
    return data.message
  }
  if (err?.message) {
    return err.message
  }
  return 'Login failed.'
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [infoVisible, setInfoVisible] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      navigate('/', { replace: true })
      return
    }
    if (location.state?.reason === 'expired') {
      setInfo('Session expired. Please sign in again.')
      setInfoVisible(true)
      window.setTimeout(() => setInfoVisible(false), 1400)
      window.setTimeout(() => setInfo(''), 1800)
    }
  }, [location.state, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      setLoading(true)
      const data = await loginUser({ email, password })
      const token = data?.token
      if (!token) {
        setError('Login failed. Missing token.')
        return
      }

      if (rememberMe) {
        localStorage.setItem('token', token)
        sessionStorage.removeItem('token')
      } else {
        sessionStorage.setItem('token', token)
        localStorage.removeItem('token')
      }

      const decoded = decodeJwt(token)
      const resolvedRole = normalizeRole(
        decoded?.role ||
          decoded?.roles?.[0] ||
          decoded?.authorities?.[0] ||
          data?.role ||
          data?.user?.role,
      )

      const resolvedUserId = decoded?.userId || decoded?.id || decoded?.user_id || decoded?.sub

      if (resolvedUserId) {
        localStorage.setItem('userId', resolvedUserId)
        sessionStorage.setItem('userId', resolvedUserId)
      } else {
        localStorage.removeItem('userId')
        sessionStorage.removeItem('userId')
      }
      if (resolvedRole) {
        localStorage.setItem('role', resolvedRole)
      }

      const redirectTo = location.state?.from?.pathname || '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog-50 via-white to-mint-50 px-4 py-16">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-fog-100 bg-white/90 p-8 shadow-glass backdrop-blur">
        <div className="mb-8 text-center flex flex-col items-center">
          <img src="/ape-logo.jpg" className="h-28 w-28 object-cover mb-4 rounded-3xl shadow-2xl border-4 border-white bg-fog-50 p-1" alt="Ape Logo" />
          <h1 className="font-display text-4xl font-black text-ink-900 uppercase tracking-tighter leading-none">APE</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.4em] font-black text-ink-500">Gateway Console</p>
          <p className="mt-4 text-xs font-bold text-ink-400 opacity-80 uppercase tracking-widest leading-relaxed px-4">Universal API Access &<br/>Control Point</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Password</label>
            <div className="flex items-center gap-2 rounded-lg border border-fog-100 bg-white px-3 py-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full bg-transparent text-sm text-ink-900 outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs font-semibold text-ink-600 transition hover:text-ink-900"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-fog-200 text-ink-900"
            />
            Remember me on this device
          </label>

          {info && (
            <div
              className={`rounded-xl border border-mint-400/40 bg-mint-400/15 p-4 text-sm font-semibold text-ink-900 shadow-glass transition duration-300 ${
                infoVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}
            >
              {info}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-fog-50 transition hover:bg-ink-700 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-600">
          New here?{' '}
          <Link to="/register" className="font-semibold text-ink-900 underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
