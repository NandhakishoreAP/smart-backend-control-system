import { useEffect, useMemo, useState } from 'react'
import api, { getDashboardAnalytics } from '../api/api'

function Dashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState('')
  const [gatewayResponse, setGatewayResponse] = useState(null)
  const [gatewayError, setGatewayError] = useState('')
  const [gatewayLoading, setGatewayLoading] = useState(false)
  const [gatewayStatus, setGatewayStatus] = useState(null)
  const [showCopied, setShowCopied] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true)
        const data = await getDashboardAnalytics()
        if (isMounted) {
          setAnalytics(data)
          setAnalyticsError('')
        }
      } catch (err) {
        if (isMounted) {
          setAnalyticsError(err?.message || 'Failed to load analytics.')
        }
      } finally {
        if (isMounted) {
          setAnalyticsLoading(false)
        }
      }
    }

    fetchAnalytics()

    return () => {
      isMounted = false
    }
  }, [])

  const handleTestGateway = async () => {
    try {
      setGatewayLoading(true)
      setGatewayError('')
      const response = await api.get('/gateway/weather/posts')
      setGatewayResponse(response.data)
      setGatewayStatus(response.status)
    } catch (err) {
      setGatewayError(err?.message || 'Failed to call gateway endpoint.')
      setGatewayResponse(null)
      setGatewayStatus(err?.response?.status || null)
    } finally {
      setGatewayLoading(false)
    }
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

  const handleCopyResponse = async () => {
    if (!gatewayResponse) {
      return
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(gatewayResponse, null, 2))
      setShowCopied(true)
      window.setTimeout(() => setShowCopied(false), 1600)
    } catch (err) {
      console.error('Failed to copy response', err)
    }
  }

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {analyticsLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="min-h-[140px] rounded-xl bg-white p-6 shadow-sm animate-pulse"
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
              className="min-h-[140px] rounded-xl bg-white p-6 shadow-sm flex flex-col justify-between"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">{kpi.label}</p>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-2xl font-semibold text-ink-900">{kpi.value}</p>
                <span className="text-sm font-semibold text-mint-600">{kpi.delta}</span>
              </div>
            </div>
          ))}
      </section>

      <section className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Live Activity</h2>
            <button className="flex items-center justify-between gap-2 rounded-xl border border-fog-100 bg-white px-3 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50">
              <span>View logs</span>
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {[
              'Payment API burst throttled at 740 rps',
              'New API key issued to Mobile Squad',
              'Webhook latency stabilized after cache warmup',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-xl border border-fog-100 bg-fog-50 px-4 py-3"
              >
                <p className="text-sm text-ink-800">{item}</p>
                <span className="text-xs text-ink-600">Just now</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
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
          <p className="mt-2 text-sm text-ink-600">GET /gateway/weather/posts</p>
          {gatewayStatus && (
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-ink-600">Status: {gatewayStatus}</p>
          )}
          {gatewayError && (
            <div className="mt-4 rounded-xl border border-signal-400/40 bg-signal-400/10 px-4 py-3 text-sm text-ink-800">
              {gatewayError}
            </div>
          )}
          {gatewayResponse && (
            <div className="mt-4 rounded-xl border border-ink-900/10 bg-ink-900 text-fog-50">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-fog-200">
                <span>Response</span>
                <button
                  onClick={handleCopyResponse}
                  className="rounded-lg border border-white/20 px-2 py-1 text-xs font-semibold text-fog-50 transition hover:bg-white/10"
                >
                  {showCopied ? 'Copied!' : 'Copy response'}
                </button>
              </div>
              <pre className="overflow-x-auto px-4 py-4 text-sm">
                <code>{JSON.stringify(gatewayResponse, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm min-h-[140px] flex flex-col justify-between xl:col-span-2">
            <h2 className="font-display text-xl font-semibold">Alerts</h2>
            <div className="mt-4 space-y-4">
              {[
                'Spike detected in /billing/summary',
                'Token cache miss rate 8.2%',
                'Rate-limit policy updated',
              ].map((item) => (
                <div key={item} className="rounded-xl border border-signal-400/30 bg-signal-400/10 px-4 py-3">
                  <p className="text-sm text-ink-800">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm min-h-[140px] flex flex-col justify-between">
            <h2 className="font-display text-xl font-semibold">Quick Actions</h2>
            <div className="mt-4 grid gap-3">
              {['Create API', 'Rotate Key', 'New Subscription'].map((item) => (
                <button
                  key={item}
                  className="flex w-full items-center justify-between rounded-xl border border-fog-100 bg-white px-4 py-3 text-left text-sm font-semibold text-ink-800 transition hover:-translate-y-0.5 hover:bg-fog-50"
                >
                  <span>{item}</span>
                  <span aria-hidden="true">&gt;</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
