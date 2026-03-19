import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getProviderAnalyticsByUser } from '../../api/api'

function ProviderAnalytics() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        if (isMounted) {
          setError('Missing user id. Please log in again.')
          setMetrics(null)
          setLoading(false)
        }
        return
      }
      try {
        setLoading(true)
        const data = await getProviderAnalyticsByUser(userId)
        if (isMounted) {
          setMetrics(data)
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load analytics.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  const apiStats = useMemo(() => {
    const list = Array.isArray(metrics?.apiStats) ? metrics.apiStats : []
    return list.map((api) => {
      const requests = Number(api.requests24h ?? 0)
      const errorRate = Number(api.errorRate ?? 0)
      const errorCount = Math.round((requests * errorRate) / 100)
      const version = api.version || 'v1'
      return {
        id: api.apiId,
        name: api.name || 'Unknown API',
        slug: api.slug || '-',
        version,
        displayName: `${api.name || 'Unknown API'} (${version})`,
        requests,
        errorRate,
        errorCount,
        avgLatency: Number(api.avgLatency ?? 0),
      }
    })
  }, [metrics])

  const highlights = useMemo(() => {
    if (!apiStats.length) {
      return {
        mostUsed: null,
        highestError: null,
      }
    }
    const mostUsed = apiStats.reduce((best, api) => (api.requests > best.requests ? api : best), apiStats[0])
    const highestError = apiStats.reduce(
      (best, api) => (api.errorRate > best.errorRate ? api : best),
      apiStats[0]
    )
    return { mostUsed, highestError }
  }, [apiStats])

  const summary = useMemo(() => {
    if (!metrics) {
      return []
    }
    return [
      { label: 'Requests (24h)', value: metrics.requests24h ?? 0 },
      { label: 'Error Rate', value: `${Number(metrics.errorRate ?? 0).toFixed(2)}%` },
      { label: 'Avg Latency', value: `${Number(metrics.avgLatency ?? 0).toFixed(0)}ms` },
      { label: 'Rate Violations', value: metrics.rateLimitViolations24h ?? 0 },
    ]
  }, [metrics])

  const chartData = useMemo(() => {
    return apiStats.map((api) => ({
      name: api.displayName,
      requests: api.requests,
      latency: api.avgLatency,
      errorRate: api.errorRate,
    }))
  }, [apiStats])

  return (
    <section className="space-y-6">
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow transition hover:shadow-md">
        <h2 className="font-display text-2xl font-semibold text-ink-900">Provider Analytics</h2>
        <p className="mt-2 text-sm text-ink-600">Track usage and performance across your APIs.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {loading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`provider-analytics-${index}`}
              className="min-h-[140px] rounded-xl bg-white p-6 shadow animate-pulse"
            >
              <div className="h-3 w-24 rounded-full bg-fog-100" />
              <div className="mt-6 h-7 w-20 rounded-full bg-fog-100" />
            </div>
          ))}
        {!loading &&
          summary.map((card) => (
            <div key={card.label} className="min-h-[140px] rounded-xl bg-white p-6 shadow transition hover:shadow-md">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">{card.label}</p>
              <p className="mt-4 text-2xl font-semibold text-ink-900">{card.value}</p>
            </div>
          ))}
      </div>

      {!loading && apiStats.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Most Used API</p>
              <p className="mt-2 text-lg font-semibold text-ink-900">
                {highlights.mostUsed?.displayName || highlights.mostUsed?.name || '—'}
              </p>
              <p className="mt-1 text-sm text-ink-600">
                {highlights.mostUsed ? `${highlights.mostUsed.requests} requests` : 'No traffic yet'}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Highest Error API</p>
              <p className="mt-2 text-lg font-semibold text-ink-900">
                {highlights.highestError?.displayName || highlights.highestError?.name || '—'}
              </p>
              <p className="mt-1 text-sm text-ink-600">
                {highlights.highestError
                  ? `${highlights.highestError.errorRate.toFixed(2)}% error rate`
                  : 'No errors yet'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-sm font-semibold text-ink-900">Requests per API</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-sm font-semibold text-ink-900">Avg Latency per API</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="latency" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {apiStats.map((api) => {
              const isHighError = api.errorRate >= 5
              return (
                <div key={api.id} className="rounded-xl bg-white p-4 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-ink-900">{api.name}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-500">{api.slug}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        isHighError ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {api.errorRate.toFixed(2)}% errors
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-ink-600">
                    <span>{api.requests} requests</span>
                    <span>{api.errorCount} errors</span>
                    <span>{api.avgLatency.toFixed(0)}ms avg latency</span>
                    <span>Error rate: {api.errorRate.toFixed(2)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

export default ProviderAnalytics
