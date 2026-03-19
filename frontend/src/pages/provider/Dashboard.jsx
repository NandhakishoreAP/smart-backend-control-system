import { useEffect, useMemo, useState } from 'react'
import { getProviderAnalytics } from '../../api/api'

function ProviderDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        setLoading(true)
        const data = await getProviderAnalytics()
        if (isMounted) {
          setMetrics(data)
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load provider metrics.')
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

  const cards = useMemo(() => {
    if (!metrics) {
      return []
    }
    return [
      {
        label: 'Total APIs',
        value: metrics.totalApis ?? 0,
      },
      {
        label: 'Subscribers',
        value: metrics.totalSubscribers ?? 0,
      },
      {
        label: 'Requests (24h)',
        value: metrics.requests24h ?? 0,
      },
      {
        label: 'Rate Violations',
        value: metrics.rateLimitViolations24h ?? 0,
      },
    ]
  }, [metrics])

  return (
    <section className="space-y-6">
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow transition hover:shadow-md">
        <p className="text-xs uppercase tracking-[0.25em] text-ink-600">Provider</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink-900">API Publisher Dashboard</h2>
        <p className="mt-2 text-sm text-ink-600">Monitor your published APIs, traffic, and subscribers.</p>
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
              key={`provider-kpi-${index}`}
              className="min-h-[140px] rounded-xl bg-white p-6 shadow animate-pulse"
            >
              <div className="h-3 w-24 rounded-full bg-fog-100" />
              <div className="mt-6 h-7 w-20 rounded-full bg-fog-100" />
            </div>
          ))}
        {!loading &&
          cards.map((card) => (
            <div key={card.label} className="min-h-[140px] rounded-xl bg-white p-6 shadow transition hover:shadow-md">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">{card.label}</p>
              <p className="mt-4 text-2xl font-semibold text-ink-900">{card.value}</p>
            </div>
          ))}
      </div>
    </section>
  )
}

export default ProviderDashboard
