import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { getApiDetails, getSubscriptions, subscribeToApi } from '../api/api'

function ApiDetails() {
  const { slug } = useParams()
  const [api, setApi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailsError, setDetailsError] = useState('')
  const [actionError, setActionError] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [toasts, setToasts] = useState([])
  const [testerMethod, setTesterMethod] = useState('GET')
  const [testerEndpoint, setTesterEndpoint] = useState('')
  const [testerResponse, setTesterResponse] = useState(null)
  const [testerError, setTesterError] = useState('')
  const [testerLoading, setTesterLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchApi = async () => {
      try {
        setLoading(true)
        const data = await getApiDetails(slug)
        const userId = localStorage.getItem('userId')
        let subscriptions = []
        if (userId) {
          subscriptions = await getSubscriptions(userId)
        }
        if (isMounted) {
          setApi(data)
          setSubscribed(subscriptions.some((item) => item.apiId === data.id))
          setDetailsError('')
        }
      } catch (err) {
        if (isMounted) {
          setDetailsError(err?.message || 'Failed to load API details')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (slug) {
      fetchApi()
      setTesterEndpoint(`/gateway/${slug}/posts`)
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  const showToast = (message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [...prev, { id, message, visible: true }])
    window.setTimeout(() => {
      setToasts((prev) => prev.map((item) => (item.id === id ? { ...item, visible: false } : item)))
    }, 1400)
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 1800)
  }

  const handleSubscribe = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId || !api?.id) {
      setActionError('Missing userId. Set localStorage userId to subscribe.')
      return
    }
    try {
      setSubscribing(true)
      await subscribeToApi(userId, api.id)
      setSubscribed(true)
      showToast('Subscribed successfully')
      setActionError('')
    } catch (err) {
      setActionError(err?.message || 'Failed to subscribe.')
    } finally {
      setSubscribing(false)
    }
  }

  const handleTestApi = async () => {
    const apiKey = localStorage.getItem('apiKey')
    if (!apiKey) {
      setTesterError('Please add API key')
      setTesterResponse(null)
      return
    }

    try {
      setTesterLoading(true)
      setTesterError('')
      setTesterResponse(null)

      const url = `http://localhost:8080${testerEndpoint}`
      const response = await axios.get(url, {
        headers: {
          'X-API-KEY': apiKey,
        },
      })

      setTesterResponse(response.data)
    } catch (err) {
      const status = err?.response?.status
      if (status === 403) {
        setTesterError('You are not subscribed')
      } else if (status === 429) {
        setTesterError('Rate limit exceeded')
      } else {
        setTesterError(err?.message || 'Failed to call gateway endpoint.')
      }
    } finally {
      setTesterLoading(false)
    }
  }

  const handleCopyResponse = async () => {
    if (!testerResponse) {
      return
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(testerResponse, null, 2))
      showToast('Copied!')
    } catch (err) {
      setTesterError('Failed to copy response.')
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <p className="text-sm text-ink-600">Loading API details...</p>
      </div>
    )
  }

  if (detailsError) {
    return (
      <div className="rounded-3xl border border-signal-400/40 bg-white/80 p-6 shadow-glass backdrop-blur">
        <p className="text-sm font-semibold text-ink-900">Unable to load API</p>
        <p className="mt-2 text-sm text-ink-600">{detailsError}</p>
      </div>
    )
  }

  if (!api) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-ink-600">API Details</p>
            <h2 className="font-display text-2xl font-semibold text-ink-900">{api.name}</h2>
            <p className="mt-2 text-sm text-ink-600">{api.description}</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-fog-100 bg-fog-50 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Slug</p>
              <p className="mt-1 font-semibold text-ink-900">{api.slug}</p>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={subscribing || subscribed}
              className="flex items-center justify-between rounded-xl border border-fog-100 bg-white px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                {subscribed ? 'Subscribed' : subscribing ? 'Subscribing...' : 'Subscribe'}
              </span>
            </button>
          </div>
        </div>
        {toasts.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 space-y-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`rounded-xl border border-mint-400/40 bg-white px-4 py-2 text-sm font-semibold text-ink-900 shadow-glass transition duration-300 ${
                  toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}
              >
                {toast.message}
              </div>
            ))}
          </div>
        )}
        {actionError && (
          <div className="mt-4 rounded-2xl border border-signal-400/40 bg-signal-400/10 px-4 py-3 text-sm text-ink-800">
            {actionError}
          </div>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-fog-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Rate Limit</p>
            <p className="mt-2 text-lg font-semibold text-ink-900">{api.rateLimit} rpm</p>
          </div>
          <div className="rounded-2xl border border-fog-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Status</p>
            <p className="mt-2 text-lg font-semibold text-ink-900">{api.active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink-900">Test API</h3>
            <p className="mt-2 text-sm text-ink-600">Send a request to the gateway endpoint.</p>
          </div>
          <button
            onClick={handleTestApi}
            disabled={testerLoading}
            className="flex items-center justify-between rounded-xl border border-fog-100 bg-white px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center gap-2">
              {testerLoading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-900/20 border-t-ink-900" />
              )}
              {testerLoading ? 'Sending...' : 'Send Request'}
            </span>
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[140px_1fr]">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Method</label>
            <select
              value={testerMethod}
              onChange={(event) => setTesterMethod(event.target.value)}
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
            >
              <option>GET</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Endpoint</label>
            <input
              value={testerEndpoint}
              onChange={(event) => setTesterEndpoint(event.target.value)}
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
            />
          </div>
        </div>

        {testerError && (
          <div className="mt-4 rounded-2xl border border-signal-400/40 bg-signal-400/10 px-4 py-3 text-sm text-ink-800">
            {testerError}
          </div>
        )}

        {testerResponse && (
          <div className="mt-4 rounded-2xl border border-ink-900/10 bg-ink-900 text-fog-50">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-fog-200">
              <span>Response</span>
              <button
                onClick={handleCopyResponse}
                className="rounded-lg border border-white/20 px-2 py-1 text-xs font-semibold text-fog-50 transition hover:bg-white/10"
              >
                Copy response
              </button>
            </div>
            <pre className="max-h-80 overflow-auto px-4 py-4 text-sm">
              <code>{JSON.stringify(testerResponse, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    </section>
  )
}

export default ApiDetails
