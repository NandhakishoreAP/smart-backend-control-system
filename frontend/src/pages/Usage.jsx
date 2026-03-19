import { useEffect, useMemo, useState } from 'react'
import { getUsageByUser } from '../api/api'

function Usage() {
  const [usageItems, setUsageItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchUsage = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        if (isMounted) {
          setError('Missing user id. Please log in again.')
          setUsageItems([])
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        const data = await getUsageByUser(userId)
        if (!isMounted) {
          return
        }
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.usage)
              ? data.usage
              : []
        setUsageItems(items)
        setError('')
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load usage data.')
          setUsageItems([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUsage()

    return () => {
      isMounted = false
    }
  }, [])

  const usageCards = useMemo(() => {
    return (usageItems || []).map((item) => {
      const requestsMade = Number(item.requestsMade ?? item.requests ?? 0)
      const limit = Number(item.totalLimit ?? item.limit ?? 0)
      const percent = limit > 0 ? Math.round((requestsMade / limit) * 100) : 0
      let barColor = 'bg-emerald-500'
      if (percent > 80) {
        barColor = 'bg-rose-500'
      } else if (percent > 50) {
        barColor = 'bg-amber-500'
      }

      return {
        id: item.id || item.apiId || item.apiName,
        apiName: item.apiName || item.name || 'Unknown API',
        requestsMade,
        limit,
        percent,
        barColor,
      }
    })
  }, [usageItems])

  if (loading) {
    return (
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-ink-600">Loading usage data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow">
        <p className="text-sm font-semibold text-ink-900">Unable to load usage</p>
        <p className="mt-2 text-sm text-ink-600">{error}</p>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {usageCards.map((item) => (
          <div
            key={item.id}
            className="rounded-xl bg-white p-4 shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-500">API Name</p>
                <h3 className="mt-1 text-lg font-semibold text-ink-900">{item.apiName}</h3>
              </div>
              <span className="text-xs font-semibold text-ink-700">
                {item.requestsMade} / {item.limit} ({item.percent}%)
              </span>
            </div>
            <div className="mt-4">
              <div className="w-full rounded-full bg-fog-100 h-2">
                <div
                  className={`h-2 rounded-full ${item.barColor}`}
                  style={{ width: `${Math.min(item.percent, 100)}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-600">
                <span>Requests Made: {item.requestsMade}</span>
                <span>Total Limit: {item.limit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {usageCards.length === 0 && (
        <div className="min-h-[140px] rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-ink-600">No usage data yet</p>
        </div>
      )}
    </section>
  )
}

export default Usage
