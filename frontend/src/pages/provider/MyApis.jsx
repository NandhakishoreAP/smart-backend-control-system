import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteProviderApiBySlug, getProviderApis, toggleProviderApi, replaceOriginalApiWithMock } from '../../api/api'
import { usePinnedApis } from '../../context/PinnedApiContext'
import { FaThumbtack, FaRegStickyNote } from 'react-icons/fa'

function MyApis() {
  const navigate = useNavigate()
  const { pinnedApis, notes, pinApi, unpinApi } = usePinnedApis()
  const [apis, setApis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingApi, setActingApi] = useState({ id: null, type: null })

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
      mockedApi: !!api.mockedApi,
      originalApiId: api.originalApiId,
    }))
  }, [apis])

  const pinnedCards = useMemo(() => cards.filter(api => pinnedApis.includes(api.id)), [cards, pinnedApis]);
  const unpinnedCards = useMemo(() => cards.filter(api => !pinnedApis.includes(api.id)), [cards, pinnedApis]);

  const handleDelete = async (apiId) => {
    const target = apis.find((api) => api.id === apiId)
    if (!target) {
      setError('API not found in list. Please refresh and try again.')
      return
    }
    const confirmDelete = window.confirm('Delete this API? This action cannot be undone.')
    if (!confirmDelete) return
    try {
      setActingApi({ id: apiId, type: 'deleting' })
      const version = target.version || 'v1'
      await deleteProviderApiBySlug(target.slug, version)
      setApis((prev) => prev.filter((api) => api.id !== apiId))
    } catch (err) {
      setError(err?.message || 'Failed to delete API.')
    } finally {
      setActingApi({ id: null, type: null })
    }
  }

  const handleToggle = async (apiId) => {
    const target = apis.find(a => a.id === apiId);
    if (!target) return;
    try {
      setActingApi({ id: apiId, type: target.active ? 'deactivating' : 'activating' })
      await toggleProviderApi(apiId)
      setApis((prev) =>
        prev.map((api) => (api.id === apiId ? { ...api, active: !(api.active ?? api.enabled) } : api))
      )
    } catch (err) {
      setError(err?.message || 'Failed to toggle API status.')
    } finally {
      setActingApi({ id: null, type: null })
    }
  }

  const handleReplaceMock = async (apiId) => {
    const confirmReplace = window.confirm('Deploy this mock? The original API will be overwritten by this mock configuration, and this duplicate will be deleted.');
    if (!confirmReplace) return;

    try {
      setActingApi({ id: apiId, type: 'replacing' });
      await replaceOriginalApiWithMock(apiId);
      // Re-fetch all APIs
      await fetchApis();
      window.alert('Mock successfully replaced the original API.');
    } catch (err) {
      setError(err?.message || 'Failed to replace original API.');
    } finally {
      setActingApi({ id: null, type: null });
    }
  }

  const renderCard = (api, isPinned) => {
    const originalApi = api.mockedApi ? cards.find(c => c.id === api.originalApiId) : null;
    return (
    <div key={api.id} className={`rounded-xl bg-white p-4 shadow ${isPinned ? 'border-2 border-yellow-200' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink-900">{api.name}</p>
            {api.mockedApi && (
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                Mock Duplicate
              </span>
            )}
          </div>
          {api.mockedApi && originalApi && (
            <p className="mt-1 text-xs text-indigo-600 font-medium">Displaying as mocked api of {originalApi.name}</p>
          )}
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-500">{api.slug}</p>
          <span className="mt-2 inline-flex items-center rounded-full bg-fog-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700">
            {api.version}
          </span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
              api.active ? 'bg-emerald-100 text-emerald-700' : 'bg-fog-100 text-ink-600'
            }`}
          >
            {api.active ? 'Active' : 'Inactive'}
          </span>
          {isPinned ? (
            <button onClick={() => unpinApi(api.id)} className="rounded-full bg-yellow-100 px-2 py-1 text-yellow-700 text-xs font-bold flex items-center gap-1 hover:bg-yellow-200 transition">
              <FaThumbtack /> Pinned
            </button>
          ) : (
            <button onClick={() => pinApi(api.id)} className="rounded-full bg-fog-100 px-2 py-1 text-ink-500 text-xs font-semibold flex items-center gap-1 hover:bg-fog-200 transition">
              <FaThumbtack /> Pin
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-600">{api.description}</p>
      <div className="mt-4 text-xs text-ink-600">Rate limit: {api.rateLimit} rpm</div>

      {isPinned && notes[api.id] && (
        <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-100 p-3 text-xs">
          <div className="flex items-center gap-1 font-semibold text-yellow-800 mb-2">
            <FaRegStickyNote /> Pinned Notes
          </div>
          <div className="space-y-2 text-yellow-900 max-h-32 overflow-y-auto">
            {Array.isArray(notes[api.id])
              ? notes[api.id].map((n, i) =>
                  typeof n === 'string' ? (
                    <div key={i} className="border-l-2 border-yellow-300 pl-2">{n}</div>
                  ) : n && typeof n === 'object' && n.text ? (
                    <div key={i} className="border-l-2 border-yellow-300 pl-2">
                      <p>{n.text}</p>
                      <p className="text-yellow-600/70 text-[10px] mt-0.5 font-medium">
                        {n.date ? new Date(n.date).toLocaleString() : ''}
                      </p>
                    </div>
                  ) : null
                )
              : <div className="border-l-2 border-yellow-300 pl-2">{notes[api.id]}</div>}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate(`/provider/apis/edit/${api.id}`)}
          className="rounded-lg border border-fog-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-fog-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => navigate(`/provider/create?cloneFrom=${api.id}`)}
          className="rounded-lg border border-fog-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-fog-50"
        >
          New version
        </button>
        <button
          type="button"
          onClick={() => handleDelete(api.id)}
          disabled={actingApi.id === api.id}
          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actingApi.id === api.id && actingApi.type === 'deleting' ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-3 w-3 text-red-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deleting...
            </span>
          ) : 'Delete'}
        </button>
        <button
          type="button"
          onClick={() => handleToggle(api.id)}
          disabled={actingApi.id === api.id}
          className="rounded-lg border border-fog-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-fog-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actingApi.id === api.id && (actingApi.type === 'activating' || actingApi.type === 'deactivating') ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-3 w-3 text-ink-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {actingApi.type === 'activating' ? 'Activating...' : 'Deactivating...'}
            </span>
          ) : (api.active ? 'Deactivate' : 'Activate')}
        </button>
        {api.mockedApi && (
          <button
            type="button"
            onClick={() => handleReplaceMock(api.id)}
            disabled={actingApi.id === api.id}
            className={`rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition ${
              actingApi.id === api.id && actingApi.type === 'replacing'
                ? 'bg-emerald-400 cursor-wait' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {actingApi.id === api.id && actingApi.type === 'replacing' ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Replacing...
              </span>
            ) : 'Replace Original API'}
          </button>
        )}
      </div>
    </div>
  )
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
            className="mt-4 inline-flex items-center rounded-lg bg-ink-900 px-4 py-2 text-xs font-semibold text-fog-50 hover:bg-ink-800"
          >
            Create API
          </button>
        </div>
      )}

      {!loading && cards.length > 0 && (
        <div className="space-y-10">
          {pinnedCards.length > 0 && (
            <div className="rounded-2xl bg-yellow-50/50 border border-yellow-200/50 p-6">
              <h3 className="mb-6 text-xl font-bold text-ink-900 flex items-center gap-2">
                <FaThumbtack className="text-yellow-600 drop-shadow-sm" /> Pinned Workspace
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pinnedCards.map(api => renderCard(api, true))}
              </div>
            </div>
          )}

          {unpinnedCards.length > 0 && (
            <div className="px-2">
              <h3 className="mb-6 text-xl font-bold text-ink-900 flex items-center gap-2">
                All Published APIs
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {unpinnedCards.map(api => renderCard(api, false))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default MyApis
