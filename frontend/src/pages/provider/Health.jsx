import { useCallback, useEffect, useMemo, useState } from 'react'
import { getProviderHealthByUser } from '../../api/api'

const REFRESH_INTERVAL_MS = 12000
const SPARKLINE_WIDTH = 120
const SPARKLINE_HEIGHT = 32

function getStatusDisplay(status, latency) {
  if (status === 'DOWN') {
    return { label: 'DOWN', badge: 'bg-red-100 text-red-700', icon: '🔴' }
  }
  if (status === 'SLOW' || latency > 300) {
    return { label: 'SLOW', badge: 'bg-amber-100 text-amber-700', icon: '🟡' }
  }
  return { label: 'UP', badge: 'bg-emerald-100 text-emerald-700', icon: '🟢' }
}

function buildSparklinePoints(values) {
  if (!values || values.length === 0) return ''
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * SPARKLINE_WIDTH
      const y = SPARKLINE_HEIGHT - ((value - min) / range) * SPARKLINE_HEIGHT
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function Health() {
  const [healthItems, setHealthItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealth = useCallback(async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      setError('Missing user id. Please log in again.')
      setHealthItems([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getProviderHealthByUser(userId)
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
      setHealthItems(items)
      setError('')
      setLastUpdated(new Date())
    } catch (err) {
      setError(err?.message || 'Failed to load health data.')
      setHealthItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  useEffect(() => {
    if (!autoRefresh) return undefined
    const intervalId = window.setInterval(() => {
      fetchHealth()
    }, REFRESH_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [autoRefresh, fetchHealth])

  const cards = useMemo(() => {
    return healthItems.map((item, index) => {
      const apiName = item.apiName || item.name || `API ${index + 1}`
      const version = item.version || 'v1'
      const status = String(item.status || 'UP').toUpperCase()
      const latency = Number(item.latency ?? 0)
      const latencyHistory = Array.isArray(item.latencyHistory)
        ? item.latencyHistory.map((value) => Number(value) || 0)
        : []
      const display = getStatusDisplay(status, latency)
      return {
        id: `${apiName}-${index}`,
        apiName,
        version,
        status: display.label,
        badge: display.badge,
        icon: display.icon,
        latency,
        latencyHistory,
        isDown: display.label === 'DOWN',
      }
    })
  }, [healthItems])

  return (
    <section className="space-y-6">
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-900">API Health Monitor</h2>
            <p className="mt-2 text-sm text-ink-600">Real-time availability and latency tracking.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink-700">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
                className="h-4 w-4 rounded border-fog-200"
              />
              Auto-refresh
            </label>
            <button
              type="button"
              onClick={fetchHealth}
              className="rounded-lg border border-fog-200 px-4 py-2 text-xs font-semibold text-ink-700"
            >
              Refresh
            </button>
            <span className="text-xs text-ink-500">
              Updated {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl bg-white p-6 shadow text-sm text-ink-600">Loading health status...</div>
      )}

      {!loading && cards.length === 0 && !error && (
        <div className="rounded-xl border border-fog-100 bg-white p-6 text-sm text-ink-600">
          No health checks available yet.
        </div>
      )}

      {!loading && cards.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`rounded-xl p-4 shadow ${
                card.isDown ? 'bg-red-50/60 border border-red-200/70 animate-pulse' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink-900">{card.apiName}</p>
                  <span className="mt-2 inline-flex items-center rounded-full bg-fog-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700">
                    {card.version}
                  </span>
                  <p className="mt-2 text-xs text-ink-500">Latency: {card.latency} ms</p>
                </div>
                <span className={`flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold ${card.badge}`}>
                  <span>{card.icon}</span>
                  {card.status}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-ink-500">Latency trend</span>
                {card.latencyHistory.length > 1 ? (
                  <svg width={SPARKLINE_WIDTH} height={SPARKLINE_HEIGHT} className="text-ink-400">
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      points={buildSparklinePoints(card.latencyHistory)}
                    />
                  </svg>
                ) : (
                  <div className="flex items-center gap-2 text-ink-300">
                    <svg width={SPARKLINE_WIDTH} height={SPARKLINE_HEIGHT}>
                      <line
                        x1="0"
                        y1={SPARKLINE_HEIGHT / 2}
                        x2={SPARKLINE_WIDTH}
                        y2={SPARKLINE_HEIGHT / 2}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    </svg>
                    <span className="text-[10px] uppercase tracking-[0.2em]">No data</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Health
