import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProviderApis } from '../../context/ProviderApiContext'
import { usePinnedApis } from '../../context/PinnedApiContext'
import { FaThumbtack, FaRegStickyNote } from 'react-icons/fa'
import { 
  getSubscriberInsights, 
  duplicateApiAsMock, 
  updateProviderApi, 
  getProviderApis, 
  getProviderAnalytics
} from '../../api/api'
import exportToCsv from './exportToCsv'
import Toast from '../../components/Toast'
import { useNavigate } from 'react-router-dom'

function ProviderDashboard() {
  const navigate = useNavigate();
  // Summary state
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toastVisible, setToastVisible] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [subscribers, setSubscribers] = useState([])

  // Pins & search state
  const { pinnedApis, pinApi, unpinApi, notes, addNote, notification } = usePinnedApis()
  const [search, setSearch] = useState('')
  const [showNotesFor, setShowNotesFor] = useState(null)
  const [noteInput, setNoteInput] = useState({})
  const [showMockEditorFor, setShowMockEditorFor] = useState(null)
  const [mockInput, setMockInput] = useState({ body: '', status: 200 })

  // Use userId from localStorage or default to empty
  const userId = localStorage.getItem('userId');

  // Shared API state
  const { apis: allApis, setApis } = useProviderApis();
  
  const fetchApis = useCallback(async (uid) => {
    if (!uid) return;
    try {
      setLoading(true);
      const data = await getProviderApis(uid);
      setApis(data);
    } catch (err) {
      setError(err?.message || 'Failed to load APIs.');
    } finally {
      setLoading(false);
    }
  }, [setApis]);

  const fetchSummary = useCallback(async (uid) => {
    if (!uid) return;
    try {
      const data = await getProviderAnalytics();
      setMetrics(data);
    } catch (err) { }
  }, []);

  const fetchSubs = useCallback(async (uid) => {
    if (!uid) return;
    try {
      const allSubs = await getSubscriberInsights(uid);
      setSubscribers(allSubs);
    } catch (err) { }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchApis(userId);
      fetchSummary(userId);
      fetchSubs(userId);
    }
  }, [userId, fetchApis, fetchSummary, fetchSubs]);

  // Filter out 'Test' API by name and also filter out mocked duplicate APIs from the dashboard view itself
  const apis = allApis.filter(api => api.name?.toLowerCase() !== 'test' && !api.mockedApi);
  
  const showToast = (msg) => {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }

  const handlePinApi = (apiId) => {
    pinApi(apiId)
    showToast('API pinned')
  }

  const handleUnpinApi = (apiId) => {
    unpinApi(apiId)
    showToast('API unpinned')
  }

  const handleAddNote = (apiId) => {
    if (noteInput[apiId]) {
      addNote(apiId, noteInput[apiId])
      setNoteInput(prev => ({ ...prev, [apiId]: '' }))
      showToast('Note added')
    }
  }

  const handleMockResponseStart = (apiId) => {
    const api = apis.find(a => a.id === apiId);
    if (!api) return;
    setMockInput({
      body: api.mockResponseBody || '{}',
      status: api.mockResponseStatus || 200
    });
    setShowMockEditorFor(apiId);
  };

  const handleSaveMockResponse = async (apiId) => {
    try {
      await updateProviderApi(apiId, {
        isMockResponseEnabled: true,
        mockResponseBody: mockInput.body,
        mockResponseStatus: mockInput.status
      });
      await fetchApis(userId);
      setShowMockEditorFor(null);
      showToast('Mock response updated and enabled');
    } catch (err) {
      showToast('Error updating mock response');
    }
  };

  const handleDisableMockResponse = async (apiId) => {
    try {
      await updateProviderApi(apiId, { isMockResponseEnabled: false });
      await fetchApis(userId);
      showToast('Live response restored');
    } catch (err) {
      showToast('Error reverting to live response');
    }
  };
  
  // --- Backend Duplicate Mock API Logic ---
  const handleMockApiDuplicate = async (apiId) => {
    try {
      await duplicateApiAsMock(apiId);
      await fetchApis(userId);
      showToast('Mock Duplicate Created! Find it in My APIs.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (msg && typeof msg === 'string' && msg.includes('already exists')) {
        showToast('A mock already exists for this API');
      } else {
        showToast('Duplicate Mock Created - Note: Fetch refresh briefly interrupted.');
        setTimeout(() => fetchApis(userId), 100);
      }
    }
  };

  // Bulk actions
  const handleBulkEnable = async () => {
    try {
      await Promise.all(apis.map(api => updateProviderApi(api.id, { active: true })));
      await fetchApis(userId);
      showToast('All APIs enabled');
    } catch (err) { }
  };
  const handleBulkDisable = async () => {
    try {
      await Promise.all(apis.map(api => updateProviderApi(api.id, { active: false })));
      await fetchApis(userId);
      showToast('All APIs disabled');
    } catch (err) { }
  };

  const handleApiStatusToggle = async (api) => {
    try {
      const newStatus = !api.active;
      await updateProviderApi(api.id, { active: newStatus });
      await fetchApis(userId);
      showToast(`${api.name} ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (err) { }
  };

  const handleExportSubscribers = () => {
    if (!subscribers.length) {
      showToast('No subscribers to export')
      return
    }
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

      {error && (
        <div className="rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800 mt-2">{error}</div>
      )}

      {/* Modern Grid: Row 1 - Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Bulk Actions */}
        <section className="rounded-xl bg-white p-6 shadow flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-xl font-semibold text-ink-900">Bulk Actions</h2>
            <button 
              onClick={() => navigate('/provider/apis')} 
              className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition py-1"
            >
              View All
            </button>
          </div>
          <div className="mb-6 flex gap-2">
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition shadow-sm" onClick={handleBulkEnable}>Enable All</button>
            <button className="rounded-lg bg-rose-600 px-4 py-2 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-rose-700 transition shadow-sm" onClick={handleBulkDisable}>Disable All</button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-fog-50 border-b border-fog-200">
                  <th className="px-4 py-3 text-left font-bold text-ink-700 uppercase tracking-wider text-[11px]">API Name</th>
                  <th className="px-4 py-3 text-left font-bold text-ink-700 uppercase tracking-wider text-[11px]">Status</th>
                  <th className="px-4 py-3 text-right font-bold text-ink-700 uppercase tracking-wider text-[11px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {(apis || []).slice(0, 6).map(api => (
                  <tr key={api.id} className="border-b border-fog-100 hover:bg-fog-50 transition-colors">
                    <td className="px-4 py-3 text-ink-800 font-medium">{api.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${api.active ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                        {api.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className={`rounded-md px-3 py-1.5 text-white text-[10px] font-black uppercase tracking-widest transition-all ${api.active ? 'bg-rose-500 hover:bg-rose-600 shadow-sm' : 'bg-emerald-500 hover:bg-emerald-600 shadow-sm'}`}
                        onClick={() => handleApiStatusToggle(api)}
                      >
                        {api.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {apis?.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-12 text-center text-ink-400 font-medium">No published APIs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Subscriber Insights */}
        <section className="rounded-xl bg-white p-6 shadow flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-xl font-semibold text-ink-900">Subscriber Insights</h2>
            <button 
              onClick={() => navigate('/provider/apis')} 
              className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition py-1"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-fog-50 border-b border-fog-200">
                  <th className="px-4 py-3 text-left font-bold text-ink-700 uppercase tracking-wider text-[11px]">Name</th>
                  <th className="px-4 py-3 text-left font-bold text-ink-700 uppercase tracking-wider text-[11px]">Email</th>
                  <th className="px-4 py-3 text-left font-bold text-ink-700 uppercase tracking-wider text-[11px]">API</th>
                  <th className="px-4 py-3 text-right font-bold text-ink-700 uppercase tracking-wider text-[11px]">Calls</th>
                </tr>
              </thead>
              <tbody>
                {(subscribers || []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-ink-400 font-medium">No active subscribers found.</td></tr>
                )}
                {(subscribers || []).slice(0, 6).map((s, idx) => (
                  <tr key={idx} className="border-b border-fog-100 hover:bg-fog-50 transition-colors">
                    <td className="px-4 py-3 text-ink-800 font-medium">{s.subscriberName || s.name || s.username || 'Unknown'}</td>
                    <td className="px-4 py-3 text-ink-500 text-xs">{s.subscriberEmail || '-'}</td>
                    <td className="px-4 py-3 text-ink-600 font-semibold">{s.apiName || s.api || s.apiTitle || '-'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{s.calls || s.usageCount || s.count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 pt-4 border-t border-fog-100">
            <button 
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-sm transition-all" 
              onClick={handleExportSubscribers}
            >
              Export Subscribers CSV
            </button>
          </div>
        </section>
      </div>

      {/* Modern Grid: Row 2 - Interactive Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mt-8">
        {/* Personalization */}
        <section className="rounded-xl bg-white p-6 shadow flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-xl font-semibold text-ink-900">Personalization</h2>
          </div>
          <div className="mb-4">
            <input
              className="border border-fog-300 rounded-xl px-4 py-3 text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              placeholder="Search and pin APIs to your workspace..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-4 flex-1">
            {/* Pinned APIs */}
            {pinnedApis.length > 0 && (
              <div>
                <div className="font-bold text-[11px] uppercase tracking-widest text-emerald-700 mb-3 ml-1">Pinned Resource Layer</div>
                <div className="flex flex-col gap-3">
                  {pinnedApis.map(id => {
                    const api = apis.find(a => a.id === id)
                    if (!api || (search && !api.name.toLowerCase().includes(search.toLowerCase()))) return null
                    return (
                      <div key={api.id} className="flex items-center justify-between border border-yellow-200 bg-yellow-50/50 rounded-xl px-4 py-4 transition-all hover:bg-yellow-50 shadow-sm relative group">
                        <div className="flex items-center gap-3">
                          <FaThumbtack className="text-yellow-600 text-lg shadow-yellow-200" title="Pinned" />
                          <span className="font-bold text-ink-900 text-base">{api.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="rounded-lg bg-white border border-yellow-300 px-3 py-1.5 text-yellow-700 text-xs font-bold uppercase tracking-tight hover:bg-yellow-100 transition shadow-xs" onClick={() => handleUnpinApi(api.id)}>Unpin</button>
                          <button className="rounded-lg bg-white border border-blue-200 px-3 py-1.5 text-blue-600 text-xs font-bold uppercase tracking-tight flex items-center gap-2 hover:bg-blue-50 transition shadow-xs" onClick={() => setShowNotesFor(api.id)}><FaRegStickyNote /> Notes</button>
                        </div>
                        {showMockEditorFor === null && showNotesFor === api.id && (
                          <div className="absolute top-16 right-0 z-50 bg-white border border-fog-200 rounded-2xl shadow-2xl p-5 w-80 outline outline-4 outline-black/5 animate-in fade-in zoom-in duration-200">
                            <div className="font-bold text-ink-900 mb-3 flex items-center justify-between">
                              <span>Notes: {api.name}</span>
                              <button onClick={() => setShowNotesFor(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                            <div className="text-xs mb-4 max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                              {notes[api.id] && Array.isArray(notes[api.id]) ? notes[api.id].map((n, i) => (
                                <div key={i} className="bg-fog-50 p-2.5 rounded-lg border border-fog-100">
                                  <div className="text-ink-800 leading-relaxed">{n.text}</div>
                                  <div className="text-ink-400 text-[10px] mt-1 font-mono uppercase">{n.date ? new Date(n.date).toLocaleString() : ''}</div>
                                </div>
                              )) : <div className="text-ink-300 italic py-4 text-center">No history logs yet.</div>}
                            </div>
                            <div className="flex gap-2">
                              <input className="border border-fog-200 rounded-lg px-3 py-2 text-xs flex-1 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="Add entry..." value={noteInput[api.id] || ''} onChange={e => setNoteInput(prev => ({ ...prev, [api.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') handleAddNote(api.id) }} />
                              <button className="rounded-lg bg-emerald-600 px-3 py-2 text-white text-xs font-bold" onClick={() => handleAddNote(api.id)}>Log</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {/* Unpinned APIs */}
            <div className="mt-4">
              <div className="font-bold text-[11px] uppercase tracking-widest text-ink-500 mb-3 ml-1">Standard Published Catalog</div>
              <div className="flex flex-col gap-3">
                {apis.filter(api => !pinnedApis.includes(api.id) && (!search || api.name.toLowerCase().includes(search.toLowerCase()))).slice(0, 4).map(api => (
                  <div key={api.id} className="flex items-center justify-between border border-fog-100 bg-white rounded-xl px-4 py-4 transition-all hover:bg-fog-50 shadow-sm group">
                    <span className="font-semibold text-ink-800 text-base">{api.name}</span>
                    <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-yellow-700 text-xs font-bold uppercase tracking-tight flex items-center gap-2 hover:bg-yellow-100 transition" onClick={() => handlePinApi(api.id)}><FaThumbtack /> Pin</button>
                      <button className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-blue-600 text-xs font-bold uppercase tracking-tight flex items-center gap-2 hover:bg-blue-50 transition" onClick={() => setShowNotesFor(api.id)}><FaRegStickyNote /> Notes</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick API Mocking */}
        <section className="rounded-xl bg-white p-6 shadow flex flex-col">
          <h2 className="font-display text-xl font-semibold text-ink-900 mb-6">Quick API Mocking</h2>
          <div className="flex flex-col gap-3 flex-1">
            {apis.slice(0, 6).map(api => {
              const hasMockDup = allApis.some(a => a.mockedApi && a.originalApiId === api.id);
              return (
                <div key={api.id} className="flex flex-col gap-3 border border-fog-100 rounded-xl p-4 bg-fog-50/50 hover:bg-fog-50 transition-all shadow-sm">
                  <div className="font-bold text-ink-900 text-base flex items-center justify-between">
                    {api.name}
                    {hasMockDup && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest">Mock Active</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <div className="flex items-center gap-3 pr-4 border-r border-fog-200">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-ink-500">Response:</span>
                      {api.mockResponseEnabled ? (
                        <div className="flex gap-2">
                          <button className="rounded-lg bg-rose-500 px-3 py-1.5 text-white text-[10px] font-bold uppercase hover:bg-rose-600 transition" onClick={() => handleDisableMockResponse(api.id)}>Kill Mock</button>
                          <button className="rounded-lg border border-blue-500 text-blue-600 bg-white px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-blue-50 transition" onClick={() => handleMockResponseStart(api.id)}>Payload</button>
                        </div>
                      ) : (
                        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition shadow-sm" onClick={() => handleMockResponseStart(api.id)}>Enable Mock</button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-ink-500">Instance:</span>
                      <button 
                        className={`rounded-lg px-4 py-2 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition shadow-sm ${hasMockDup ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-emerald-600 hover:bg-emerald-700'}`} 
                        onClick={() => handleMockApiDuplicate(api.id)}
                        disabled={hasMockDup}
                      >
                        {hasMockDup ? 'Duplicated' : 'Duplicate Mock'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Persistence Helpers */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-2xl shadow-2xl text-white font-bold animate-in slide-in-from-bottom duration-300 ${notification.type === 'pin' ? 'bg-emerald-600' : 'bg-gray-800'}`}>
          <div className="flex items-center gap-3">
            <FaThumbtack className={notification.type === 'pin' ? 'animate-bounce' : ''} />
            <span>Resource {notification.type === 'pin' ? 'Pinned to Layer' : 'Returned to Catalog'}</span>
          </div>
        </div>
      )}

      {/* Mock Editor Modal */}
      {showMockEditorFor && (() => {
        const api = apis.find(a => a.id === showMockEditorFor);
        if (!api) return null;
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/40 backdrop-blur-md transition-all">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xl border border-fog-200 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-2xl text-ink-900 leading-tight">Intercept System</h3>
                  <p className="text-sm text-ink-500 mt-1">Configuring virtual response for node: <span className="font-mono text-emerald-600 font-bold">{api.name}</span></p>
                </div>
                <button onClick={() => setShowMockEditorFor(null)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition">✕</button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-ink-400 mb-2">Network Status Code</label>
                  <input className="border border-fog-200 rounded-xl px-4 py-3 w-full text-base font-mono focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" type="number" value={mockInput.status} onChange={e => setMockInput(m => ({ ...m, status: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-ink-400 mb-2">Payload Definition</label>
                  <textarea className="border border-fog-200 rounded-xl px-4 py-3 w-full text-sm font-mono focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-fog-50/50" rows={8} value={mockInput.body} onChange={e => setMockInput(m => ({ ...m, body: e.target.value }))} placeholder='{ "status": "success", "data": ... }' />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-10">
                <button className="rounded-xl bg-gray-100 text-ink-600 px-6 py-3 text-sm font-bold hover:bg-gray-200 transition" onClick={() => setShowMockEditorFor(null)}>Discard</button>
                <button className="rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200 px-8 py-3 text-white text-sm font-black uppercase tracking-widest hover:bg-emerald-700 transition-all hover:-translate-y-0.5 active:translate-y-0" onClick={() => handleSaveMockResponse(api.id)}>Commit & Deploy</button>
              </div>
            </div>
          </div>
        );
      })()}

      <Toast message={toast} visible={toastVisible} onClose={() => setToastVisible(false)} />

    </div>
  )
}

export default ProviderDashboard
