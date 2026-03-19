import { useEffect, useMemo, useState } from 'react'
import ApiCard from '../components/ApiCard'
import { getApis, getSubscriptions } from '../api/api'

function ApiCatalog() {
  const [apis, setApis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subscribedIds, setSubscribedIds] = useState(new Set())
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [rateLimitFilter, setRateLimitFilter] = useState('All')

  useEffect(() => {
    let isMounted = true

    const fetchApis = async () => {
      try {
        setLoading(true)
        const data = await getApis()
        const userId = localStorage.getItem('userId')
        let subscriptions = []
        if (userId) {
          subscriptions = await getSubscriptions(userId)
        }
        if (isMounted) {
          setApis(data)
          setSubscribedIds(new Set(subscriptions.map((item) => item.apiId)))
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load APIs')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchApis()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [search])

  const filteredApis = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase()

    return apis.filter((api) => {
      const name = (api.name || '').toLowerCase()
      const description = (api.description || '').toLowerCase()
      const matchesSearch =
        !normalizedSearch ||
        name.includes(normalizedSearch) ||
        description.includes(normalizedSearch)

      let isActive = true
      if (typeof api.active === 'boolean') {
        isActive = api.active
      } else if (typeof api.isActive === 'boolean') {
        isActive = api.isActive
      } else if (typeof api.status === 'string') {
        isActive = api.status.toLowerCase() === 'active'
      }

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && isActive) ||
        (statusFilter === 'Inactive' && !isActive)

      const rateLimit = Number(api.rateLimit ?? 0)
      const matchesRate =
        rateLimitFilter === 'All' ||
        (rateLimitFilter === 'Low' && rateLimit < 100) ||
        (rateLimitFilter === 'Medium' && rateLimit >= 100 && rateLimit <= 500) ||
        (rateLimitFilter === 'High' && rateLimit > 500)

      return matchesSearch && matchesStatus && matchesRate
    })
  }, [apis, debouncedSearch, rateLimitFilter, statusFilter])

  if (loading) {
    return (
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-ink-600">Loading APIs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow">
        <p className="text-sm font-semibold text-ink-900">Unable to load APIs</p>
        <p className="mt-2 text-sm text-ink-600">{error}</p>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-ink-600">Browse APIs available in the marketplace.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search APIs..."
            className="w-full rounded border border-fog-100 px-3 py-2 text-sm text-ink-900"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-500"
            >
              ✖
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded border border-fog-100 px-3 py-2 text-sm text-ink-900"
          >
            <option value="All">All status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            value={rateLimitFilter}
            onChange={(event) => setRateLimitFilter(event.target.value)}
            className="rounded border border-fog-100 px-3 py-2 text-sm text-ink-900"
          >
            <option value="All">All rate limits</option>
            <option value="Low">Low (&lt;100)</option>
            <option value="Medium">Medium (100–500)</option>
            <option value="High">High (&gt;500)</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredApis.map((api) => (
          <ApiCard
            key={api.id}
            name={api.name}
            description={api.description}
            rateLimit={api.rateLimit}
            slug={api.slug}
            version={api.version}
            subscribed={subscribedIds.has(api.id)}
          />
        ))}
      </div>
      {filteredApis.length === 0 && (
        <div className="min-h-[140px] rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-ink-600">No APIs found</p>
        </div>
      )}
    </section>
  )
}

export default ApiCatalog
