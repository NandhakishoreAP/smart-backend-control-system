import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteProviderApiBySlug, getProviderApis, toggleProviderApi } from '../../api/api'

function MyApis() {
  const navigate = useNavigate()
  const [apis, setApis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)

  const fetchApis = useCallback(async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      setError('Missing user id. Please log in again.')
      setApis([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getProviderApis(userId)
      setApis(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [])
      setError('')
    } catch (err) {
      setError(err?.message || 'Failed to load APIs.')
      setApis([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApis()
  }, [fetchApis])

  const cards = useMemo(() => {
    return apis.map((api) => ({
      id: api.id,
      name: api.name || api.apiName || 'Untitled API',
      description: api.description || 'No description',
      slug: api.slug || api.apiSlug || '-',
      version: api.version || 'v1',
      rateLimit: api.rateLimit ?? api.rpm ?? 0,
      active: api.active ?? api.enabled ?? false,
    }))
  }, [apis])

  const handleDelete = async (apiId) => {
    const target = apis.find((api) => api.id === apiId)
    if (!target) {
      setError('API not found in list. Please refresh and try again.')
      return
    }
    const confirmDelete = window.confirm('Delete this API? This action cannot be undone.')
    if (!confirmDelete) return
    try {
      setActionId(apiId)
      const version = target.version || 'v1'
      await deleteProviderApiBySlug(target.slug, version)
      setApis((prev) => prev.filter((api) => api.id !== apiId))
    } catch (err) {
      setError(err?.message || 'Failed to delete API.')
    } finally {
      setActionId(null)
    }
  }

  const handleToggle = async (apiId) => {
    try {
      setActionId(apiId)
      await toggleProviderApi(apiId)
      setApis((prev) =>
        prev.map((api) => (api.id === apiId ? { ...api, active: !(api.active ?? api.enabled) } : api))
      )
    } catch (err) {
      setError(err?.message || 'Failed to toggle API status.')
    } finally {
      setActionId(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow transition hover:shadow-md">
        <h2 className="font-display text-2xl font-semibold text-ink-900">My APIs</h2>
        <p className="mt-2 text-sm text-ink-600">Manage and monitor the APIs you have published.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl bg-white p-6 shadow text-sm text-ink-600">Loading APIs...</div>
      )}

      {!loading && cards.length === 0 && (
        <div className="rounded-xl border border-fog-100 bg-white p-6 text-sm text-ink-600">
          <p>No APIs created yet.</p>
          <button
            type="button"
            onClick={() => navigate('/provider/create')}
            className="mt-4 inline-flex items-center rounded-lg bg-ink-900 px-4 py-2 text-xs font-semibold text-fog-50"
          >
            Create API
          </button>
        </div>
      )}

      {!loading && cards.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((api) => (
            <div key={api.id} className="rounded-xl bg-white p-4 shadow">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink-900">{api.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-500">{api.slug}</p>
                  <span className="mt-2 inline-flex items-center rounded-full bg-fog-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700">
                    {api.version}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    api.active ? 'bg-emerald-100 text-emerald-700' : 'bg-fog-100 text-ink-600'
                  }`}
                >
                  {api.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-3 text-sm text-ink-600">{api.description}</p>
              <div className="mt-4 text-xs text-ink-600">Rate limit: {api.rateLimit} rpm</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/provider/apis/edit/${api.id}`)}
                  className="rounded-lg border border-fog-200 px-3 py-2 text-xs font-semibold text-ink-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/provider/create?cloneFrom=${api.id}`)}
                  className="rounded-lg border border-fog-200 px-3 py-2 text-xs font-semibold text-ink-700"
                >
                  New version
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(api.id)}
                  disabled={actionId === api.id}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(api.id)}
                  disabled={actionId === api.id}
                  className="rounded-lg border border-fog-200 px-3 py-2 text-xs font-semibold text-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {api.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default MyApis
