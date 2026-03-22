import { useMemo, useState } from 'react'

const apiCatalog = [] // No sample/test APIs

function Apis() {
  const [apiSearch, setApiSearch] = useState('')
  const [selectedApiId, setSelectedApiId] = useState(apiCatalog[0]?.id || '')

  const filteredApis = useMemo(
    () =>
      apiCatalog.filter((api) =>
        `${api.name} ${api.route} ${api.owner}`.toLowerCase().includes(apiSearch.toLowerCase()),
      ),
    [apiSearch],
  )

  const selectedApi = filteredApis.find((api) => api.id === selectedApiId) || filteredApis[0]

  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">API Catalog</h2>
          <span className="text-xs text-ink-600">{filteredApis.length} APIs</span>
        </div>
        <div className="mt-4">
          <input
            value={apiSearch}
            onChange={(event) => setApiSearch(event.target.value)}
            placeholder="Search APIs, routes, owners"
            className="w-full rounded-xl border border-fog-100 bg-white px-4 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
          />
        </div>
        <div className="mt-5 space-y-3">
          {filteredApis.map((api) => (
            <button
              key={api.id}
              onClick={() => setSelectedApiId(api.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                api.id === selectedApi?.id
                  ? 'border-mint-400 bg-mint-400/10'
                  : 'border-fog-100 bg-white hover:-translate-y-0.5 hover:bg-fog-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">{api.name}</p>
                <span className="rounded-full bg-ink-900 px-2 py-0.5 text-xs text-fog-50">
                  {api.version}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-600">{api.route}</p>
              <p className="mt-2 text-xs text-ink-600">Owner: {api.owner}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-ink-600">API Detail</p>
            <h2 className="font-display text-2xl font-semibold text-ink-900">
              {selectedApi?.name || 'Select an API'}
            </h2>
            <p className="text-sm text-ink-600">{selectedApi?.route}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              selectedApi?.status === 'Healthy'
                ? 'bg-mint-400/20 text-mint-600'
                : selectedApi?.status === 'Warning'
                  ? 'bg-signal-400/20 text-signal-600'
                  : 'bg-ink-600/10 text-ink-700'
            }`}
          >
            {selectedApi?.status || 'Unknown'}
          </span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-fog-100 bg-fog-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Latency</p>
            <p className="mt-2 text-lg font-semibold text-ink-900">{selectedApi?.latency || '--'}</p>
          </div>
          <div className="rounded-2xl border border-fog-100 bg-fog-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Requests/sec</p>
            <p className="mt-2 text-lg font-semibold text-ink-900">{selectedApi?.rps || '--'}</p>
          </div>
          <div className="rounded-2xl border border-fog-100 bg-fog-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Owner</p>
            <p className="mt-2 text-lg font-semibold text-ink-900">{selectedApi?.owner || '--'}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-fog-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Policy</p>
            <p className="mt-2 text-sm text-ink-800">Rate limit 800 rps, burst 1200</p>
          </div>
          <div className="rounded-2xl border border-fog-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Auth</p>
            <p className="mt-2 text-sm text-ink-800">X-API-KEY required</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {['View metrics', 'Edit policy', 'Rotate keys', 'Deploy new version'].map((item) => (
            <button
              key={item}
              className="rounded-xl border border-fog-100 bg-white px-4 py-2 text-sm font-semibold text-ink-800 transition hover:-translate-y-0.5 hover:bg-fog-50"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Apis
