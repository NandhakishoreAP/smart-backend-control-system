import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../api/api'

const roleOptions = [
  { value: 'API_PROVIDER', label: 'Publisher (API PROVIDER)' },
  { value: 'API_CONSUMER', label: 'Subscriber (API CONSUMER)' },
]

const getErrorMessage = (err) => {
  if (!err) {
    return 'Registration failed.'
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
  return 'Registration failed.'
}

function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState(roleOptions[0].value)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      setLoading(true)
      await registerUser({ name, email, password, role })
      setSuccess('Account created. Redirecting to login...')
      window.setTimeout(() => navigate('/login', { replace: true }), 1200)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog-50 via-white to-mint-50 px-4 py-16">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-fog-100 bg-white/90 p-8 shadow-glass backdrop-blur">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-600">Get started</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Create account</h1>
          <p className="mt-2 text-sm text-ink-600">Publish and consume APIs with confidence.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              placeholder="Nandha"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              placeholder="nandha@test.com"
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

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Role</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-mint-400/40 bg-mint-400/15 p-4 text-sm font-semibold text-ink-900">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-fog-50 transition hover:bg-ink-700 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-ink-900 underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
