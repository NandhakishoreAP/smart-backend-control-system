import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, {
  getApiKeys,
  getConsumerDashboard,
  getSubscriptions,
} from '../api/api'

function Dashboard() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState('')
  const [activityLogs, setActivityLogs] = useState([])
  const [lastUpdated, setLastUpdated] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [savedKeys, setSavedKeys] = useState([])
  const [savedKeysError, setSavedKeysError] = useState('')
  const [keyToast, setKeyToast] = useState('')
  const [keyToastVisible, setKeyToastVisible] = useState(false)
  const revealTimerRef = useRef(null)
  const [gatewayResponse, setGatewayResponse] = useState(null)
  const [gatewayError, setGatewayError] = useState('')
  const [gatewayLoading, setGatewayLoading] = useState(false)
  const [gatewayStatus, setGatewayStatus] = useState(null)
  const [gatewayEndpoint, setGatewayEndpoint] = useState('/gateway/weather/posts')
  const [gatewayMethod, setGatewayMethod] = useState('GET')
  const [showCopied, setShowCopied] = useState(false)
  const [copiedVisible, setCopiedVisible] = useState(false)
  const [recentTests, setRecentTests] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)
  const [subscriptionsError, setSubscriptionsError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true)
        const storedKey = localStorage.getItem('apiKey')
        if (!storedKey) {
          if (isMounted) {
            setAnalyticsError('Missing API key. Save one in the header first.')
            setAnalytics(null)
            setActivityLogs([])
            setLastUpdated('')
            setAnalyticsLoading(false)
          }
          return
        }
        const data = await getConsumerDashboard(storedKey)
        if (!isMounted) {
          return
        }
        setAnalytics(data)
        setActivityLogs(data?.recentLogs || [])
        setLastUpdated(new Date().toLocaleTimeString())
        setAnalyticsError('')
      } catch (err) {
        if (!isMounted) {
          return
        }
        setAnalyticsError(err?.message || 'Failed to load analytics.')
        setAnalytics(null)
        setActivityLogs([])
      } finally {
        if (isMounted) {
          setAnalyticsLoading(false)
        }
      }
    }

    fetchAnalytics()
    const intervalId = window.setInterval(fetchAnalytics, 10000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])


  useEffect(() => {
    let isMounted = true

    const fetchSubscriptions = async () => {
      const storedUserId = localStorage.getItem('userId')
      if (!storedUserId) {
        if (isMounted) {
          setSubscriptions([])
          setSubscriptionsError('')
        }
        return
      }
      try {
        setSubscriptionsLoading(true)
        const data = await getSubscriptions(storedUserId)
        if (isMounted) {
          setSubscriptions(data || [])
          setSubscriptionsError('')
        }
      } catch (err) {
        if (isMounted) {
          setSubscriptionsError(err?.message || 'Failed to load subscriptions.')
        }
      } finally {
        if (isMounted) {
          setSubscriptionsLoading(false)
        }
      }
    }

    fetchSubscriptions()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadKeys = async () => {
      try {
        const data = await getApiKeys()
        if (isMounted) {
          setSavedKeys(data || [])
          setSavedKeysError('')
        }
      } catch (err) {
        if (isMounted) {
          setSavedKeysError(err?.message || 'Failed to load saved keys.')
        }
      }
    }

    const handleRefreshKeys = () => {
      const stored = localStorage.getItem('apiKey') || ''
      const normalized = stored.replace(/^\s*X-API-KEY\s*:\s*/i, '').trim()
      if (normalized !== stored) {
        localStorage.setItem('apiKey', normalized)
      }
      setApiKey(normalized)
      loadKeys()
    }

    handleRefreshKeys()
    window.addEventListener('apiKeyUpdated', handleRefreshKeys)

    return () => {
      isMounted = false
      window.removeEventListener('apiKeyUpdated', handleRefreshKeys)
    }
  }, [])


  const handleTestGateway = async () => {
    try {
      setGatewayLoading(true)
      setGatewayError('')
      const response = await api.request({
        url: gatewayEndpoint,
        method: gatewayMethod,
      })
      setGatewayResponse(response.data)
      setGatewayStatus(response.status)
      setRecentTests((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          method: gatewayMethod,
          endpoint: gatewayEndpoint,
          status: response.status,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ].slice(0, 5))
    } catch (err) {
      setGatewayError(err?.message || 'Failed to call gateway endpoint.')
      setGatewayResponse(null)
      setGatewayStatus(err?.response?.status || null)
      setRecentTests((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          method: gatewayMethod,
          endpoint: gatewayEndpoint,
          status: err?.response?.status || 'ERR',
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ].slice(0, 5))
    } finally {
      setGatewayLoading(false)
    }
  }

  const showKeyToast = (message) => {
    setKeyToast(message)
    setKeyToastVisible(true)
    window.setTimeout(() => setKeyToastVisible(false), 1400)
    window.setTimeout(() => setKeyToast(''), 1800)
  }

  const handleSaveKey = () => {
    const normalized = apiKey.replace(/^\s*X-API-KEY\s*:\s*/i, '').trim()
    localStorage.setItem('apiKey', normalized)
    localStorage.removeItem('scs_api_key')
    setApiKey(normalized)
    window.dispatchEvent(new Event('apiKeyUpdated'))
    showKeyToast('API key saved')
  }

  const handleCopyHeader = async () => {
    const value = `X-API-KEY: ${apiKey.trim() || '<your-key>'}`
    try {
      await navigator.clipboard.writeText(value)
      showKeyToast('Header copied')
    } catch (err) {
      showKeyToast('Copy failed')
    }
  }

  const handleToggleKeyVisibility = () => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
    setShowApiKey((prev) => !prev)
  }

  const handleRevealKey = () => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
    }
    setShowApiKey(true)
    revealTimerRef.current = window.setTimeout(() => {
      setShowApiKey(false)
      revealTimerRef.current = null
    }, 5000)
  }

  const handleSelectSavedKey = (selected) => {
    if (!selected?.apiKey) {
      return
    }
    const normalized = selected.apiKey.replace(/^\s*X-API-KEY\s*:\s*/i, '').trim()
    setApiKey(normalized)
    localStorage.setItem('apiKey', normalized)
    localStorage.removeItem('scs_api_key')
    window.dispatchEvent(new Event('apiKeyUpdated'))
    showKeyToast('API key selected')
  }

  const maskKey = (value) => {
    if (!value) {
      return ''
    }
    const last4 = value.slice(-4)
    return `****${last4}`
  }

  const formatDate = (value) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
  }


  const kpis = useMemo(() => {
    if (!analytics) {
      return []
    }

    return [
      {
        label: 'Requests (24h)',
        value: analytics.requests24h?.toLocaleString() || '0',
        delta: '—',
      },
      {
        label: 'Error Rate',
        value: `${analytics.errorRate?.toFixed(2) || '0.00'}%`,
        delta: '—',
      },
      {
        label: 'Avg Latency',
        value: `${analytics.avgLatency ?? 0}ms`,
        delta: '—',
      },
      {
        label: 'Active APIs',
        value: analytics.activeApis?.toString() || '0',
        delta: '—',
      },
    ]
  }, [analytics])

  const formatRelativeTime = (value) => {
    if (!value) {
      return 'just now'
    }
    const timestamp = new Date(value)
    const diffMs = Date.now() - timestamp.getTime()
    if (Number.isNaN(diffMs)) {
      return value
    }
    const diffSeconds = Math.floor(diffMs / 1000)
    if (diffSeconds < 60) {
      return 'just now'
    }
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    }
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) {
      return `${diffHours}h ago`
    }
    return timestamp.toLocaleString()
  }

  const liveActivity = useMemo(() => {
    return (activityLogs || []).slice(0, 6).map((log) => ({
      id: log.id,
      message: `${log.method} ${log.endpoint} • ${log.status} • ${log.latency}ms`,
      time: formatRelativeTime(log.timestamp),
    }))
  }, [activityLogs])

  const alerts = useMemo(() => {
    const items = []
    if (!analytics) {
      return items
    }
    if (analytics.errorRate > 5) {
      items.push(`Error rate elevated at ${analytics.errorRate.toFixed(2)}%`)
    }
    if (analytics.avgLatency > 800) {
      items.push(`Latency high at ${analytics.avgLatency}ms avg`)
    }
    if (analytics.requests24h === 0) {
      items.push('No traffic in the last 24h')
    }
    const recent429 = (activityLogs || []).some((log) => log.status === 429)
    if (recent429) {
      items.push('Recent rate limiting detected (429)')
    }
    if (items.length === 0) {
      items.push('All systems normal')
    }
    return items
  }, [analytics, activityLogs])


  const showNormalAlert = alerts.length === 1 && alerts[0] === 'All systems normal'
  const showMissingKey = !apiKey.trim()

  const handleCopyResponse = async () => {
    if (!gatewayResponse) {
      return
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(gatewayResponse, null, 2))
      setShowCopied(true)
      setCopiedVisible(true)
      window.setTimeout(() => setCopiedVisible(false), 1400)
      window.setTimeout(() => setShowCopied(false), 1800)
    } catch (err) {
      console.error('Failed to copy response', err)
    }
  }

  return (
    <div className="space-y-10">
      {showCopied && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl border border-mint-400/40 bg-white px-4 py-2 text-sm font-semibold text-ink-900 shadow-glass transition duration-300 ${
            copiedVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          Copied!
        </div>
      )}
      {keyToast && (
        <div
          className={`fixed bottom-16 right-6 z-50 rounded-xl border border-mint-400/40 bg-mint-400/15 px-4 py-2 text-sm font-semibold text-ink-900 shadow-glass transition duration-300 ${
            keyToastVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          {keyToast}
        </div>
      )}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {analyticsLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="min-h-[140px] rounded-xl bg-white p-6 shadow animate-pulse"
            >
              <div className="h-3 w-24 rounded-full bg-fog-100" />
              <div className="mt-6 h-7 w-20 rounded-full bg-fog-100" />
            </div>
          ))}
        {!analyticsLoading && analyticsError && (
          <div className="col-span-full rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
            {analyticsError}
          </div>
        )}
        {!analyticsLoading && !analyticsError &&
          kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="min-h-[140px] rounded-xl bg-white p-6 shadow transition hover:shadow-md flex flex-col justify-between"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">{kpi.label}</p>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-2xl font-semibold text-ink-900">{kpi.value}</p>
                <span className="text-sm font-semibold text-mint-600">{kpi.delta}</span>
              </div>
            </div>
          ))}
      </section>

      <section className="grid gap-6 xl:auto-rows-fr xl:grid-cols-[2fr_1fr] xl:items-stretch">
        <div className="min-h-[140px] h-full rounded-xl bg-white p-3 shadow transition hover:shadow-md xl:col-start-1 xl:row-start-1">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Live Activity</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
              {lastUpdated ? `Updated ${lastUpdated}` : 'Updating...'}
            </p>
          </div>
          <div className="mt-3 space-y-1">
            {liveActivity.length === 0 && (
              <div className="rounded-xl border border-fog-100 bg-fog-50 px-2 py-1.5 text-sm text-ink-600">
                No activity yet. Send a request to see live logs.
              </div>
            )}
            {liveActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-fog-100 bg-fog-50 px-2 py-1.5"
              >
                <p className="text-sm text-ink-800">{item.message}</p>
                <span className="text-xs text-ink-600">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-[140px] h-full rounded-xl bg-white p-3 shadow transition hover:shadow-md xl:col-start-2 xl:row-start-1">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-600">API Key Header</p>
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="X-API-KEY"
            className="mt-2 w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleKeyVisibility}
              className="rounded-lg border border-fog-100 bg-white px-3 py-1 text-xs font-semibold text-ink-800 transition hover:bg-fog-50"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
            <button
              type="button"
              onClick={handleRevealKey}
              className="rounded-lg border border-fog-100 bg-white px-3 py-1 text-xs font-semibold text-ink-800 transition hover:bg-fog-50"
            >
              Reveal 5s
            </button>
            <button
              type="button"
              onClick={handleCopyHeader}
              className="rounded-lg border border-fog-100 bg-white px-3 py-1 text-xs font-semibold text-ink-800 transition hover:bg-fog-50"
            >
              Copy header
            </button>
          </div>
          {showMissingKey && (
            <div className="mt-3 rounded-xl border border-signal-400/40 bg-signal-400/10 px-3 py-2 text-xs text-ink-800">
              API key is missing. Generate one in API Keys or select a saved key.
            </div>
          )}
          <div className="mt-4">
            <p className="text-xs text-ink-600">Saved keys</p>
            <select
              value=""
              onChange={(event) => {
                const selected = savedKeys.find((item) => String(item.id) === event.target.value)
                handleSelectSavedKey(selected)
              }}
              className="mt-2 w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-xs text-ink-900"
            >
              <option value="">Select saved key</option>
              {savedKeys.map((item) => {
                const isActive = item.apiKey === localStorage.getItem('apiKey')
                return (
                  <option key={item.id} value={item.id}>
                    {maskKey(item.apiKey)} • {formatDate(item.createdAt)}{isActive ? ' • active' : ''}
                  </option>
                )
              })}
            </select>
            {savedKeysError && (
              <p className="mt-1 text-[11px] text-signal-600">{savedKeysError}</p>
            )}
            <button
              type="button"
              onClick={handleSaveKey}
              className="mt-3 w-full rounded-lg bg-ink-900 px-4 py-2 text-xs font-semibold text-fog-50 transition hover:bg-ink-700"
            >
              Save Key
            </button>
          </div>
        </div>

        <div className="min-h-[140px] h-full rounded-xl bg-white p-3 shadow transition hover:shadow-md xl:col-start-1 xl:row-start-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Active APIs</h2>
            <span className="text-xs font-semibold text-ink-800">
              {subscriptions.length.toString()}
            </span>
          </div>
          <div className="mt-3 space-y-1">
            {subscriptionsLoading && (
              <div className="rounded-xl border border-fog-100 bg-fog-50 px-2 py-1.5 text-sm text-ink-600">
                Loading subscribed APIs...
              </div>
            )}
            {!subscriptionsLoading && subscriptionsError && (
              <div className="rounded-xl border border-signal-400/30 bg-signal-400/10 px-2 py-1.5 text-sm text-ink-700">
                {subscriptionsError}
              </div>
            )}
            {!subscriptionsLoading && !subscriptionsError &&
              subscriptions.slice(0, 6).map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between rounded-xl border border-fog-100 bg-fog-50 px-2 py-1.5"
                >
                  <span className="text-sm text-ink-800 truncate">{subscription.apiName}</span>
                  <span className="text-xs text-ink-600">
                    {subscription.subscribedAt ? formatDate(subscription.subscribedAt) : 'Subscribed'}
                  </span>
                </div>
              ))}
            {!subscriptionsLoading && !subscriptionsError && subscriptions.length === 0 && (
              <div className="rounded-xl border border-fog-100 bg-fog-50 px-2 py-1.5 text-sm text-ink-600">
                No subscribed APIs yet.
              </div>
            )}
          </div>
        </div>

        <div className="min-h-[140px] h-full rounded-xl bg-white p-3 shadow transition hover:shadow-md xl:col-start-2 xl:row-start-2">
          <h2 className="font-display text-xl font-semibold">Quick Actions</h2>
          <div className="mt-2 grid gap-2">
            <button
              onClick={() => navigate('/apis')}
              className="flex w-full items-center justify-between rounded-xl border border-fog-100 bg-white px-4 py-3 text-left text-sm font-semibold text-ink-800 transition hover:-translate-y-0.5 hover:bg-fog-50"
            >
              <span>Browse APIs</span>
              <span aria-hidden="true">&gt;</span>
            </button>
            <button
              onClick={() => navigate('/api-keys')}
              className="flex w-full items-center justify-between rounded-xl border border-fog-100 bg-white px-4 py-3 text-left text-sm font-semibold text-ink-800 transition hover:-translate-y-0.5 hover:bg-fog-50"
            >
              <span>Manage API Keys</span>
              <span aria-hidden="true">&gt;</span>
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="flex w-full items-center justify-between rounded-xl border border-fog-100 bg-white px-4 py-3 text-left text-sm font-semibold text-ink-800 transition hover:-translate-y-0.5 hover:bg-fog-50"
            >
              <span>API Analytics</span>
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
        </div>

        <div className="min-h-[140px] h-full rounded-xl bg-white p-3 shadow transition hover:shadow-md xl:col-start-1 xl:row-start-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Test Gateway API</h2>
            <button
              onClick={handleTestGateway}
              className="flex items-center justify-between gap-2 rounded-xl border border-fog-100 bg-white px-3 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50"
            >
              <span>{gatewayLoading ? 'Testing...' : 'Run test'}</span>
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-[120px_1fr]">
            <select
              value={gatewayMethod}
              onChange={(event) => setGatewayMethod(event.target.value)}
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
            <input
              value={gatewayEndpoint}
              onChange={(event) => setGatewayEndpoint(event.target.value)}
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
              placeholder="/gateway/your-api/posts"
            />
          </div>
          {gatewayStatus && (
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink-600">Status: {gatewayStatus}</p>
          )}
          {gatewayError && (
            <div className="mt-2 rounded-xl border border-signal-400/40 bg-signal-400/10 px-3 py-2 text-xs text-ink-800">
              {gatewayError}
            </div>
          )}
          <div className="mt-2 rounded-xl border border-fog-100 bg-fog-50 px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Recent Tests</p>
              <button
                type="button"
                onClick={handleCopyResponse}
                className="text-xs font-semibold text-ink-700"
              >
                Copy last
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {recentTests.length === 0 && (
                <p className="text-sm text-ink-500">No tests yet.</p>
              )}
              {recentTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between text-sm text-ink-700">
                  <span className="truncate">{test.method} {test.endpoint}</span>
                  <span className="text-ink-500">{test.status}</span>
                </div>
              ))}
            </div>
          </div>
          {gatewayResponse && (
            <div className="mt-2 rounded-xl border border-ink-900/10 bg-ink-900 text-fog-50">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-fog-200">
                <span>Response</span>
                <button
                  onClick={handleCopyResponse}
                  className="rounded-lg border border-white/20 px-2 py-1 text-xs font-semibold text-fog-50 transition hover:bg-white/10"
                >
                  Copy response
                </button>
              </div>
              <pre className="max-h-48 overflow-x-auto px-4 py-3 text-xs">
                <code>{JSON.stringify(gatewayResponse, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>

        <div className="min-h-[140px] h-full rounded-xl bg-white p-3 shadow transition hover:shadow-md xl:col-start-2 xl:row-start-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Alerts</h2>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs font-semibold text-ink-700"
            >
              View analytics
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {showNormalAlert && (
              <div className="rounded-xl border border-fog-100 bg-fog-50 px-3 py-2 text-sm text-ink-600">
                All systems normal. Keep sending traffic to surface alerts.
              </div>
            )}
            {!showNormalAlert &&
              alerts.map((item) => (
                <div key={item} className="rounded-xl border border-signal-400/30 bg-signal-400/10 px-3 py-2">
                  <p className="text-sm text-ink-800">{item}</p>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
