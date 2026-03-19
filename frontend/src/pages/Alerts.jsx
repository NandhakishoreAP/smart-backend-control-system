import { useEffect, useMemo, useState } from 'react'
import { getConsumerDashboard } from '../api/api'

function Alerts() {
  const [summary, setSummary] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    let isMounted = true
    const apiKey = localStorage.getItem('apiKey')
    if (!apiKey) {
      setError('Missing API key. Save one in the header first.')
      setLoading(false)
      return () => {
        isMounted = false
      }
    }

    const loadAlerts = async () => {
      try {
        setLoading(true)
        const data = await getConsumerDashboard(apiKey)
        if (isMounted) {
          setSummary(data)
          setRecentLogs(data?.recentLogs || [])
          setLastUpdated(new Date().toLocaleTimeString())
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load alerts.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadAlerts()
    const interval = window.setInterval(loadAlerts, 10000)

    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [])

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

  const alerts = useMemo(() => {
    const items = []
    if (summary) {
      if (summary.errorRate > 5) {
        items.push({
          title: 'Error rate elevated',
          detail: `Error rate is ${summary.errorRate.toFixed(2)}% in the last 24h.`,
          level: 'Warn',
          time: 'Now',
        })
      }
      if (summary.avgLatency > 800) {
        items.push({
          title: 'Latency spike detected',
          detail: `Average latency is ${summary.avgLatency}ms in the last 24h.`,
          level: 'Warn',
          time: 'Now',
        })
      }
      if (summary.requests24h === 0) {
        items.push({
          title: 'No traffic detected',
          detail: 'No requests in the last 24 hours.',
          level: 'Info',
          time: 'Now',
        })
      }
    }
    const has429 = recentLogs.some((log) => log.status === 429)
    if (has429) {
      items.push({
        title: 'Rate limiting detected',
        detail: 'Recent requests were throttled (429).',
        level: 'Warn',
        time: formatRelativeTime(recentLogs[0]?.timestamp),
      })
    }
    if (items.length === 0) {
      items.push({
        title: 'All systems normal',
        detail: 'No critical alerts. Keep sending traffic to surface anomalies.',
        level: 'Info',
        time: 'Now',
      })
    }
    return items
  }, [summary, recentLogs])

  return (
    <section className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-fog-100 bg-white/80 p-5 shadow-glass backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Alerts</p>
            <p className="mt-2 text-sm text-ink-600">
              Live signals generated from your gateway traffic.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
            {lastUpdated ? `Updated ${lastUpdated}` : 'Updating...'}
          </p>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-fog-100 bg-white/80 p-5 shadow-glass backdrop-blur animate-pulse">
          <div className="h-3 w-28 rounded-full bg-fog-100" />
          <div className="mt-4 h-4 w-60 rounded-full bg-fog-100" />
        </div>
      )}

      {!loading && alerts.map((alert) => (
        <div
          key={`${alert.title}-${alert.time}`}
          className="rounded-2xl border border-fog-100 bg-white/80 p-5 shadow-glass backdrop-blur"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">{alert.title}</p>
              <p className="mt-1 text-xs text-ink-600">{alert.detail}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-600">{alert.time}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                  alert.level === 'Warn'
                    ? 'bg-signal-400/20 text-signal-600'
                    : 'bg-mint-400/20 text-mint-700'
                }`}
              >
                {alert.level}
              </span>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}

export default Alerts
