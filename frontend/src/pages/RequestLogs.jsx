import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRequestLogsByUser } from '../api/api'

const PAGE_SIZE = 10

function formatTimestamp(value) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function getStatusTone(statusCode) {
  if (statusCode >= 500) return 'text-red-600 bg-red-50'
  if (statusCode === 400 || statusCode === 403) return 'text-amber-600 bg-amber-50'
  if (statusCode === 200) return 'text-emerald-600 bg-emerald-50'
  return 'text-ink-700 bg-fog-100'
}

function normalizeLogs(payload) {
  const logs = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.logs)
      ? payload.logs
      : Array.isArray(payload?.items)
        ? payload.items
        : []

  return logs.map((item, index) => ({
    id: item.id ?? item.requestId ?? `${item.endpoint || item.path || 'log'}-${index}`,
    method: item.method || item.httpMethod || item.verb || 'GET',
    endpoint: item.endpoint || item.path || item.url || '-',
    statusCode: Number(item.statusCode ?? item.status ?? item.code ?? 0),
    latencyMs: Number(item.latencyMs ?? item.latency ?? item.durationMs ?? 0),
    timestamp: item.timestamp || item.createdAt || item.time || null,
  }))
}

function RequestLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [autoPoll, setAutoPoll] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selectedLog, setSelectedLog] = useState(null)

  const fetchLogs = useCallback(async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      setError('Missing user id. Please log in again.')
      setLogs([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getRequestLogsByUser(userId)
      setLogs(normalizeLogs(data))
      setError('')
      setLastUpdated(new Date())
    } catch (err) {
      setError(err?.message || 'Failed to load request logs.')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (!autoPoll) return
    const intervalId = window.setInterval(() => {
      fetchLogs()
    }, 10000)
    return () => window.clearInterval(intervalId)
  }, [autoPoll, fetchLogs])

  const filteredLogs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return logs.filter((log) => {
      if (methodFilter !== 'ALL' && log.method !== methodFilter) {
        return false
      }
      if (statusFilter !== 'ALL') {
        if (statusFilter === '200' && log.statusCode !== 200) return false
        if (statusFilter === '400' && log.statusCode !== 400 && log.statusCode !== 403) return false
        if (statusFilter === '500' && log.statusCode < 500) return false
      }
      if (search && !String(log.endpoint).toLowerCase().includes(search)) {
        return false
      }
      return true
    })
  }, [logs, methodFilter, statusFilter, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [methodFilter, statusFilter, searchTerm])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  if (loading) {
    return (
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-ink-600">Loading request logs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow">
        <p className="text-sm font-semibold text-ink-900">Unable to load request logs</p>
        <p className="mt-2 text-sm text-ink-600">{error}</p>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500" htmlFor="method-filter">
            Method
          </label>
          <select
            id="method-filter"
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value)}
            className="rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm"
          >
            <option value="ALL">All</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500" htmlFor="status-filter">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm"
          >
            <option value="ALL">All</option>
            <option value="200">200</option>
            <option value="400">400/403</option>
            <option value="500">500+</option>
          </select>
          </div>
          <div className="flex w-full max-w-sm items-center gap-2">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by endpoint"
              className="w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-600">
            <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-600">200 OK</span>
            <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-600">400/403 Warn</span>
            <span className="rounded-full bg-red-50 px-2 py-1 font-semibold text-red-600">500 Error</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchLogs}
              className="rounded-lg border border-fog-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-fog-50"
            >
              Refresh
            </button>
            <label className="flex items-center gap-2 text-xs font-semibold text-ink-700">
              <input
                type="checkbox"
                checked={autoPoll}
                onChange={(event) => setAutoPoll(event.target.checked)}
                className="h-4 w-4 rounded border-fog-200"
              />
              Auto-poll
            </label>
            <span className="text-xs text-ink-500">
              Updated {lastUpdated ? formatTimestamp(lastUpdated) : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse">
            <thead className="bg-fog-50 text-left text-xs uppercase tracking-[0.2em] text-ink-500">
              <tr>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Endpoint</th>
                <th className="px-4 py-3">Status Code</th>
                <th className="px-4 py-3">Latency (ms)</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  className="cursor-pointer border-t border-fog-100 text-sm text-ink-700 transition hover:bg-fog-50"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="px-4 py-3 font-semibold text-ink-900">{log.method}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">{log.endpoint}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusTone(log.statusCode)}`}>
                      {log.statusCode || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{log.latencyMs}</td>
                  <td className="px-4 py-3 text-xs text-ink-600">{formatTimestamp(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-ink-600">No request logs found.</div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-ink-600">
          Showing {filteredLogs.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-fog-200 px-3 py-2 text-xs font-semibold text-ink-700 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </button>
          <span className="text-xs text-ink-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-fog-200 px-3 py-2 text-xs font-semibold text-ink-700 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-40 bg-ink-900/40 p-4">
          <div className="ml-auto h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Request Detail</p>
                <h2 className="mt-1 text-lg font-semibold text-ink-900">{selectedLog.endpoint}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-fog-200 px-3 py-2 text-xs font-semibold text-ink-700"
              >
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-4 text-sm text-ink-700">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Method</span>
                <span className="font-semibold text-ink-900">{selectedLog.method}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Status</span>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusTone(selectedLog.statusCode)}`}>
                  {selectedLog.statusCode || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Latency</span>
                <span>{selectedLog.latencyMs} ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Timestamp</span>
                <span>{formatTimestamp(selectedLog.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default RequestLogs
