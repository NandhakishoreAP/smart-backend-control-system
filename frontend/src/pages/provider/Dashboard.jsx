import { useEffect, useState, useMemo } from 'react';
import { useProviderApis } from '../../context/ProviderApiContext'
import { usePinnedApis } from '../../context/PinnedApiContext'
import { FaThumbtack, FaRegStickyNote, FaCode, FaExchangeAlt } from 'react-icons/fa'
import { getProviderAnalyticsByUser, getSubscriptions, getProviderApis, updateProviderApi, getSubscriberInsights } from '../../api/api'
import exportToCsv from './exportToCsv'
import Toast from '../../components/Toast'

function ProviderDashboard() {
    // --- Migration: Sync old mock state from MyApis (object) to Dashboard (array) if needed ---
    useEffect(() => {
      // If Dashboard's mockedApis is empty but MyApis' mockedApis exists, migrate
      try {
        const dashboard = JSON.parse(localStorage.getItem('mockedApisDashboard') || '[]');
        const myApis = JSON.parse(localStorage.getItem('mockedApis') || '{}');
        if ((!dashboard || dashboard.length === 0) && myApis && Object.keys(myApis).length > 0) {
          // Convert object to array format
          const migrated = Object.entries(myApis).map(([apiId, val]) => ({
            apiId,
            mock: val.mockData !== undefined ? { body: typeof val.mockData === 'string' ? val.mockData : JSON.stringify(val.mockData), status: 200, headers: '' } : { body: '{"message": "mocked!"}', status: 200, headers: '' },
            enabled: true,
            replacingOriginal: !!val.replaceOriginal
          }));
          localStorage.setItem('mockedApisDashboard', JSON.stringify(migrated));
          setMockedApis(migrated);
        }
      } catch {}
    }, []);
  // Summary state
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Shared API state
  const { apis: allApis, setApis, fetchApis } = useProviderApis();
  // Filter out 'Test' API by name (case-insensitive)
  const apis = allApis.filter(api => api.name?.toLowerCase() !== 'test');
  const { pinnedApis, setPinnedApis } = usePinnedApis();
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('apiNotes') || '{}');
    } catch {
      return {};
    }
  });

  // Persist notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('apiNotes', JSON.stringify(notes));
  }, [notes]);
  const [search, setSearch] = useState('')
  const [noteInput, setNoteInput] = useState({}) // { [apiId]: '' }
  const [showNotesFor, setShowNotesFor] = useState(null)
  // mockedApis: [{apiId, mock: {body, status, headers}, enabled: true, replacingOriginal: false}]
  const [mockedApis, setMockedApis] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mockedApisDashboard') || '[]');
    } catch {
      return [];
    }
  });
  const [showMockEditorFor, setShowMockEditorFor] = useState(null)
  const [mockInput, setMockInput] = useState({ body: '{"message": "mocked!"}', status: 200, headers: '' })
  const [subscribers, setSubscribers] = useState([])

  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const showToast = (message) => {
    setToast(message)
    setToastVisible(true)
    window.setTimeout(() => setToastVisible(false), 1400)
    window.setTimeout(() => setToast(''), 1800)
  }

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const userId = '9';
      try {
        setLoading(true);
        const data = await getProviderAnalyticsByUser(userId);
        if (isMounted) {
          setMetrics(data);
          setError('');
        }
        await fetchApis(userId);
        const insights = await getSubscriberInsights(userId);
        if (isMounted) {
          setSubscribers(insights);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load analytics.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchApis]);

  // Pin/unpin handlers
  const handlePinApi = (apiId) => {
    setPinnedApis((prev) => {
      if (prev.includes(apiId)) return prev;
      showToast(`Pinned API`);
      return [...prev, apiId];
    });
  };
  const handleUnpinApi = (apiId) => {
    setPinnedApis((prev) => {
      if (!prev.includes(apiId)) return prev;
      showToast(`Unpinned API`);
      return prev.filter((id) => id !== apiId);
    });
  };
  // Notes handlers
  const handleAddNote = (apiId) => {
    const text = noteInput[apiId]?.trim()
    if (!text) return
    setNotes(prev => ({
      ...prev,
      [apiId]: [...(prev[apiId] || []), { text, date: new Date() }]
    }))
    setNoteInput(prev => ({ ...prev, [apiId]: '' }))
  }
  // Mock editor handlers
  // --- Persistent Mock State Logic ---
  // Save to localStorage whenever mockedApis changes
  useEffect(() => {
    localStorage.setItem('mockedApisDashboard', JSON.stringify(mockedApis));
  }, [mockedApis]);

  // On mount, sync from localStorage (in case of reload)
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mockedApisDashboard') || '[]');
      setMockedApis(Array.isArray(stored) ? stored : []);
    } catch {
      setMockedApis([]);
    }
  }, []);

  const handleMockApi = (apiId) => {
    setShowMockEditorFor(apiId);
    const existing = mockedApis.find(m => m.apiId === apiId);
    if (existing) setMockInput(existing.mock);
    else setMockInput({ body: '{"message": "mocked!"}', status: 200, headers: '' });
  };
  const handleSaveMock = (apiId) => {
    setMockedApis(prev => {
      const others = prev.filter(m => m.apiId !== apiId);
      return [...others, { apiId, mock: { ...mockInput }, enabled: true, replacingOriginal: false }];
    });
    setShowMockEditorFor(null);
    showToast('Mock saved and enabled');
  };
  const handleUnmockApi = (apiId) => {
    setMockedApis(prev => prev.filter(m => m.apiId !== apiId));
    showToast('Mock disabled for API');
  };
  const handleDisableMock = (apiId) => {
    setMockedApis(prev => prev.map(m => m.apiId === apiId ? { ...m, enabled: false } : m));
    showToast('Mock disabled for API');
  };
  const handleEnableMock = (apiId) => {
    setMockedApis(prev => prev.map(m => m.apiId === apiId ? { ...m, enabled: true } : m));
    showToast('Mock enabled for API');
  };
  const handleReplaceOriginal = (apiId) => {
    setMockedApis(prev => prev.map(m => m.apiId === apiId ? { ...m, replacingOriginal: true } : m));
    showToast('Mock replaced original API!');
  };
  // Bulk actions
  const handleBulkEnable = async () => {
    await Promise.all(apis.map(api => updateProviderApi(api.id, { active: true })));
    await fetchApis('9');
    showToast('All APIs enabled');
  };
  const handleBulkDisable = async () => {
    await Promise.all(apis.map(api => updateProviderApi(api.id, { active: false })));
    await fetchApis('9');
    showToast('All APIs disabled');
  };

  // Per-API enable/disable
  const handleApiStatusToggle = async (api) => {
    const newStatus = !api.active;
    await updateProviderApi(api.id, { active: newStatus });
    await fetchApis('9');
    showToast(`${api.name} ${newStatus ? 'activated' : 'deactivated'}`);
  };
  // Export subscribers (real data)
  const handleExportSubscribers = () => {
    if (!subscribers.length) {
      showToast('No subscribers to export')
      return
    }
    // Map to CSV-friendly format
    const csvData = subscribers.map(s => ({
      name: s.subscriberName || s.name || '-',
      email: s.subscriberEmail || '-',
      api: s.apiName || s.api || '-',
      calls: s.callCount || s.calls || s.usageCount || 0
    }))
    exportToCsv('subscribers.csv', csvData)
    showToast('Subscribers exported as CSV')
  }

  const summary = useMemo(() => {
    if (!metrics) return []
    return [
      { label: 'Total APIs', value: metrics.totalApis ?? 0 },
      { label: 'Subscribers', value: metrics.totalSubscribers ?? 0 },
      { label: 'Rate Violations (24h)', value: metrics.rateLimitViolations24h ?? 0 },
      { label: 'Requests (24h)', value: metrics.requests24h ?? 0 },
    ]
  }, [metrics])

  return (
    <div className="space-y-10">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {loading && Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="min-h-[100px] rounded-xl bg-white p-6 shadow animate-pulse">
            <div className="h-3 w-24 rounded-full bg-fog-100" />
            <div className="mt-6 h-7 w-20 rounded-full bg-fog-100" />
          </div>
        ))}
        {!loading && summary.map((card) => (
          <div key={card.label} className="min-h-[100px] rounded-xl bg-white p-6 shadow transition hover:shadow-md">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">{card.label}</p>
            <p className="mt-4 text-2xl font-semibold text-ink-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800 mt-2">{error}</div>
      )}

      {/* Modern 2-column grid for features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-fr">
        {/* Left column: Bulk Actions, Personalization, Notes */}
        <div className="flex flex-col gap-8 h-full">
          {/* Bulk Actions - real API list with checkboxes */}
          <section className="rounded-xl bg-white p-6 shadow flex flex-col h-full min-h-[420px]">
            <h2 className="font-display text-xl font-semibold text-ink-900 mb-4">Bulk Actions</h2>
            <div className="mb-4">
              <button className="rounded-lg bg-emerald-600 px-5 py-2 text-white text-base font-semibold mr-4" onClick={handleBulkEnable}>Enable All APIs</button>
              <button className="rounded-lg bg-rose-600 px-5 py-2 text-white text-base font-semibold" onClick={handleBulkDisable}>Disable All APIs</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-fog-100">
                    <th className="p-2 text-left">API Name</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {apis.map(api => (
                    <tr key={api.id} className="border-b">
                      <td className="p-2">{api.name}</td>
                      <td className="p-2">
                        <span className={api.active ? 'text-green-600 font-semibold' : 'text-rose-600 font-semibold'}>
                          {api.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2">
                        <button
                          className={api.active ? 'rounded bg-rose-600 px-3 py-1 text-white text-xs' : 'rounded bg-emerald-600 px-3 py-1 text-white text-xs'}
                          onClick={() => handleApiStatusToggle(api)}
                        >
                          {api.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Personalization - search, pin/unpin, notes, sidebar */}
          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="font-display text-xl font-semibold text-ink-900 mb-4">Personalization</h2>
            <div className="mb-2 text-sm text-ink-700">Search, pin, and add notes to your APIs.</div>
            <input
              className="border rounded px-3 py-2 text-sm mb-4 w-full"
              placeholder="Search APIs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {/* Sidebar-style vertical list */}
            <div className="flex flex-col gap-2">
              {/* Pinned APIs */}
              {pinnedApis.length > 0 && (
                <div>
                  <div className="font-semibold text-emerald-700 flex items-center gap-1 mb-1">
                    <FaThumbtack className="inline text-yellow-500" /> Pinned APIs
                  </div>
                  {pinnedApis.map(id => {
                    const api = apis.find(a => a.id === id)
                    if (!api || (search && !api.name.toLowerCase().includes(search.toLowerCase()))) return null
                    return (
                      <div key={api.id} className="flex items-center gap-2 border border-yellow-300 bg-yellow-50 rounded px-2 py-1 mb-1">
                        <FaThumbtack className="text-yellow-500" title="Pinned" />
                        <span className="font-medium">{api.name}</span>
                        <button className="rounded bg-gray-400 px-2 py-1 text-white text-xs" onClick={() => handleUnpinApi(api.id)}>Unpin</button>
                        <button className="rounded bg-blue-500 px-2 py-1 text-white text-xs flex items-center gap-1" onClick={() => setShowNotesFor(api.id)}><FaRegStickyNote />Notes</button>
                        {showNotesFor === api.id && (
                          <div className="absolute z-10 bg-white border rounded shadow p-3 mt-2">
                            <div className="font-semibold mb-1">Notes for {api.name}</div>
                            <ul className="text-xs mb-2 max-h-32 overflow-y-auto">
                              {(notes[api.id] || []).map((n, i) => (
                                <li key={i}>{n.text} <span className="text-ink-400">({new Date(n.date).toLocaleString()})</span></li>
                              ))}
                            </ul>
                            <div className="flex gap-1">
                              <input
                                className="border rounded px-2 py-1 text-xs flex-1"
                                placeholder="Add a note..."
                                value={noteInput[api.id] || ''}
                                onChange={e => setNoteInput(prev => ({ ...prev, [api.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddNote(api.id) }}
                              />
                              <button className="rounded bg-emerald-600 px-2 py-1 text-white text-xs" onClick={() => handleAddNote(api.id)}>Add</button>
                              <button className="rounded bg-gray-200 px-2 py-1 text-xs" onClick={() => setShowNotesFor(null)}>Close</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Unpinned APIs */}
              <div>
                <div className="font-semibold text-ink-700 mb-1">All APIs</div>
                {apis.filter(api => !pinnedApis.includes(api.id) && (!search || api.name.toLowerCase().includes(search.toLowerCase()))).map(api => (
                  <div key={api.id} className="flex items-center gap-2 border rounded px-2 py-1 mb-1">
                    <span>{api.name}</span>
                    <button className="rounded bg-yellow-500 px-2 py-1 text-white text-xs flex items-center gap-1" onClick={() => handlePinApi(api.id)}><FaThumbtack />Pin</button>
                    <button className="rounded bg-blue-500 px-2 py-1 text-white text-xs flex items-center gap-1" onClick={() => setShowNotesFor(api.id)}><FaRegStickyNote />Notes</button>
                    {showNotesFor === api.id && (
                      <div className="absolute z-10 bg-white border rounded shadow p-3 mt-2">
                        <div className="font-semibold mb-1">Notes for {api.name}</div>
                        <ul className="text-xs mb-2 max-h-32 overflow-y-auto">
                          {(notes[api.id] || []).map((n, i) => (
                            <li key={i}>{n.text} <span className="text-ink-400">({new Date(n.date).toLocaleString()})</span></li>
                          ))}
                        </ul>
                        <div className="flex gap-1">
                          <input
                            className="border rounded px-2 py-1 text-xs flex-1"
                            placeholder="Add a note..."
                            value={noteInput[api.id] || ''}
                            onChange={e => setNoteInput(prev => ({ ...prev, [api.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddNote(api.id) }}
                          />
                          <button className="rounded bg-emerald-600 px-2 py-1 text-white text-xs" onClick={() => handleAddNote(api.id)}>Add</button>
                          <button className="rounded bg-gray-200 px-2 py-1 text-xs" onClick={() => setShowNotesFor(null)}>Close</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Collaboration & Notes */}
          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="font-display text-xl font-semibold text-ink-900 mb-4">Collaboration & Notes</h2>
            <div className="mb-2 text-sm text-ink-700">Add notes and collaborate with your team.</div>
            <div className="flex gap-2 mb-2">
              <input
                className="border rounded px-3 py-2 text-sm flex-1"
                placeholder="Add a note..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value) {
                    setNotes((prev) => [...prev, { text: e.target.value, date: new Date() }])
                    e.target.value = ''
                  }
                }}
              />
            </div>
            <ul className="text-sm text-ink-700 list-disc list-inside">
              {Array.isArray(notes)
                ? notes.map((n, i) => (
                    <li key={i}>{n.text} <span className="text-ink-400">({new Date(n.date).toLocaleString()})</span></li>
                  ))
                : null}
            </ul>
          </section>
        </div>

        {/* Right column: Subscriber Insights, Mocking */}
        <div className="flex flex-col gap-8 h-full">
          {/* Subscriber Insights - table */}
          <section className="rounded-xl bg-white p-6 shadow flex flex-col h-full min-h-[420px]">
            <h2 className="font-display text-xl font-semibold text-ink-900 mb-4">Subscriber Insights</h2>
            <div className="mb-2 text-sm text-ink-700">All subscribers for your APIs, with details.</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-fog-100">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">API Subscribed</th>
                    <th className="p-2 text-left">Calls</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.length === 0 && (
                    <tr><td colSpan={4} className="p-2">No subscribers found.</td></tr>
                  )}
                  {subscribers.slice(0, 10).map((s, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{s.subscriberName || s.name || s.username || 'Unknown'}</td>
                      <td className="p-2">{s.subscriberEmail || '-'}</td>
                      <td className="p-2">{s.apiName || s.api || s.apiTitle || '-'}</td>
                      <td className="p-2">{s.calls || s.usageCount || s.count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white text-base font-semibold" onClick={handleExportSubscribers}>Export Subscribers</button>
          </section>

          {/* Quick API Mocking - toggle per API */}
          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="font-display text-xl font-semibold text-ink-900 mb-4">Quick API Mocking</h2>
            <div className="mb-2 text-sm text-ink-700">Instantly enable mock responses for any API for testing or downtime.</div>
            <div className="flex flex-wrap gap-2">
              {apis.map(api => {
                const mockObj = mockedApis.find(m => m.apiId === api.id);
                return (
                  <div key={api.id} className="flex items-center gap-2 border rounded px-2 py-1">
                    <span>{api.name}</span>
                    {mockObj && mockObj.enabled ? (
                      <>
                        <button className="rounded bg-gray-400 px-2 py-1 text-white text-xs" onClick={() => handleDisableMock(api.id)}>Disable</button>
                        <button className="rounded bg-blue-500 px-2 py-1 text-white text-xs" onClick={() => setShowMockEditorFor(api.id)}>Edit</button>
                      </>
                    ) : (
                      // Show Enable Mock if not enabled (either never mocked, or disabled)
                      (!mockObj || mockObj.enabled === false) ? (
                        <button className="rounded bg-indigo-600 px-2 py-1 text-white text-xs" onClick={() => handleMockApi(api.id)}>Enable Mock</button>
                      ) : null
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-ink-500">Mocked APIs: {mockedApis.filter(m => m.enabled).map(m => apis.find(a => a.id === m.apiId)?.name).filter(Boolean).join(', ') || 'None'}</div>

            {/* Mock Editor Modal */}
            {showMockEditorFor && (() => {
              const api = apis.find(a => a.id === showMockEditorFor);
              if (!api) return null;
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                  <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                    <div className="font-semibold mb-2">Edit Mock Response for {api.name}</div>
                    <div className="mb-2">
                      <label className="block text-xs font-semibold mb-1">Body (JSON):</label>
                      <textarea className="border rounded px-2 py-1 w-full text-xs font-mono" rows={4} value={mockInput.body} onChange={e => setMockInput(m => ({ ...m, body: e.target.value }))} />
                    </div>
                    <div className="mb-2 flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1">Status:</label>
                        <input className="border rounded px-2 py-1 w-full text-xs" type="number" value={mockInput.status} onChange={e => setMockInput(m => ({ ...m, status: Number(e.target.value) }))} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1">Headers (JSON):</label>
                        <input className="border rounded px-2 py-1 w-full text-xs font-mono" value={mockInput.headers} onChange={e => setMockInput(m => ({ ...m, headers: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button className="rounded bg-emerald-600 px-3 py-1 text-white text-xs" onClick={() => handleSaveMock(api.id)}>Save</button>
                      <button className="rounded bg-gray-200 px-3 py-1 text-xs" onClick={() => setShowMockEditorFor(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>
        </div>
      </div>
      <Toast message={toast} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </div>
  )
}

export default ProviderDashboard
