import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getConsumerDashboard,
  getConsumerEndpointStats,
  getDashboardAnalytics,
} from '../api/api'

function Analytics() {
  const [summary, setSummary] = useState(null)
  const [endpoints, setEndpoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')

  useEffect(() => {
    let isMounted = true;
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
      setError('Missing API key. Save one in the header first.');
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const [summaryData, endpointData] = await Promise.all([
          getConsumerDashboard(apiKey),
          getConsumerEndpointStats(apiKey),
        ]);
        if (isMounted) {
          setSummary(summaryData);
          setEndpoints(endpointData || []);
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load analytics.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();
    const intervalId = window.setInterval(loadAnalytics, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true

    const fetchDashboardAnalytics = async () => {
      try {
        setDashboardLoading(true)
        const data = await getDashboardAnalytics()
        if (!isMounted) {
          return
        }
        setDashboardAnalytics(data)
        setDashboardError('')
      } catch (err) {
        if (!isMounted) {
          return
        }
        setDashboardError(err?.message || 'Failed to load dashboard analytics.')
        setDashboardAnalytics(null)
      } finally {
        if (isMounted) {
          setDashboardLoading(false)
        }
      }
    }

    fetchDashboardAnalytics()
    const intervalId = window.setInterval(fetchDashboardAnalytics, 15000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  const insights = useMemo(() => {
    if (!summary) {
      return []
    }
    return [
      {
        label: 'Requests (24h)',
        value: summary.requests24h?.toLocaleString() || '0',
        trend: '—',
      },
      {
        label: 'Error Rate',
        value: `${summary.errorRate?.toFixed(2) || '0.00'}%`,
        trend: '—',
      },
      {
        label: 'Avg Latency',
        value: `${summary.avgLatency ?? 0}ms`,
        trend: '—',
      },
    ]
  }, [summary])

  const topEndpoints = useMemo(() => {
    return [...(endpoints || [])].slice(0, 6)
  }, [endpoints])

  const chartPalette = useMemo(
    () => ({
      line: '#0ea5e9',
      success: '#10b981',
      errors: '#f97316',
      bar: '#6366f1',
      axis: '#94a3b8',
      tooltipBorder: '#e2e8f0',
      tooltipBg: '#ffffff',
    }),
    []
  )

  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: chartPalette.tooltipBg,
      border: `1px solid ${chartPalette.tooltipBorder}`,
      borderRadius: '12px',
      boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
      fontSize: '12px',
    }),
    [chartPalette]
  )

  const requestsOverTime = dashboardAnalytics?.requestsOverTime || []
  const errorRate = Number(dashboardAnalytics?.errorRate ?? 0)
  const successRate = Math.max(0, 100 - errorRate)
  const requestsTotal = Number(dashboardAnalytics?.requests24h ?? 0)
  const errorCount = Math.round((requestsTotal * errorRate) / 100)
  const avgLatencyValue = Number(dashboardAnalytics?.avgLatency ?? 0)
  const latencyPercent = Math.min(100, Math.round((avgLatencyValue / 1000) * 100))
  const pieData = [
    { name: 'Success', value: successRate },
    { name: 'Errors', value: errorRate },
  ]
  const barData = [
    { name: 'Requests', count: requestsTotal },
    { name: 'Errors', count: errorCount },
  ]

  return (
    <section className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {loading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`insight-${idx}`}
              className="rounded-2xl border border-fog-100 bg-white/80 p-5 shadow-glass backdrop-blur animate-pulse"
            >
              <div className="h-3 w-24 rounded-full bg-fog-100" />
              <div className="mt-6 h-7 w-16 rounded-full bg-fog-100" />
            </div>
          ))}
        {!loading && !error &&
          insights.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-fog-100 bg-white/80 p-5 shadow-glass backdrop-blur"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">{item.label}</p>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-2xl font-semibold text-ink-900">{item.value}</p>
                <span className="text-sm font-semibold text-mint-600">{item.trend}</span>
              </div>
            </div>
          ))}
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {dashboardLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`dashboard-skeleton-${index}`}
              className="min-h-[260px] rounded-xl bg-white p-4 shadow animate-pulse"
            >
              <div className="h-4 w-40 rounded-full bg-fog-100" />
              <div className="mt-6 h-40 w-full rounded-xl bg-fog-100" />
            </div>
          ))}
        {!dashboardLoading && dashboardError && (
          <div className="md:col-span-2 rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
            {dashboardError}
          </div>
        )}
        {!dashboardLoading && !dashboardError && (
          <>
            <div className="rounded-xl bg-white p-4 shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-900">Requests Over Time</h3>
                <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Last 24h</span>
              </div>
              <div className="mt-4 h-60">
                {requestsOverTime.length === 0 ? (
                  <p className="text-sm text-ink-600">No request data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={requestsOverTime} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke={chartPalette.axis} />
                      <YAxis tick={{ fontSize: 12 }} stroke={chartPalette.axis} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="count" stroke={chartPalette.line} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-900">Error Rate</h3>
                <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Success vs Errors</span>
              </div>
              <div className="mt-4 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.name === 'Errors' ? chartPalette.errors : chartPalette.success}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-ink-600">
                <span>Success {successRate.toFixed(1)}%</span>
                <span>Errors {errorRate.toFixed(1)}%</span>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-900">Requests vs Errors</h3>
                <span className="text-xs uppercase tracking-[0.2em] text-ink-500">24h totals</span>
              </div>
              <div className="mt-4 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={chartPalette.axis} />
                    <YAxis tick={{ fontSize: 12 }} stroke={chartPalette.axis} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill={chartPalette.bar} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-900">Avg Latency</h3>
                <span className="text-xs uppercase tracking-[0.2em] text-ink-500">p50</span>
              </div>
              <div className="mt-5 flex items-end gap-3">
                <p className="text-3xl font-semibold text-ink-900">{avgLatencyValue}ms</p>
                <span className="text-xs text-ink-500">rolling 24h</span>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-fog-100">
                <div
                  className="h-2 rounded-full bg-ink-900/80"
                  style={{ width: `${latencyPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-ink-500">Target &lt; 250ms</p>
            </div>
          </>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
          <h2 className="font-display text-xl font-semibold">Endpoint Health</h2>
          {!loading && !error && endpoints.length === 0 && (
            <div className="mt-6 rounded-2xl border border-fog-100 bg-fog-50 px-4 py-3 text-sm text-ink-600">
              No traffic yet. Send requests through the gateway to populate analytics.
            </div>
          )}
          {topEndpoints.length > 0 && (
            <div className="mt-6 space-y-3">
              {topEndpoints.map((item) => (
                <div
                  key={item.endpoint}
                  className="rounded-2xl border border-fog-100 bg-fog-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink-900">{item.endpoint}</p>
                    <span className="text-xs text-ink-600">{item.requests} calls</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-600">
                    <span>Error rate: {item.errorRate?.toFixed(2) || '0.00'}%</span>
                    <span>Avg latency: {item.avgLatency ?? 0}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
          <h2 className="font-display text-xl font-semibold">Top Endpoints</h2>
          <div className="mt-6 space-y-4">
            {topEndpoints.length === 0 && (
              <p className="text-sm text-ink-600">No endpoints tracked yet.</p>
            )}
            {topEndpoints.map((item) => (
              <div key={item.endpoint} className="flex items-center justify-between">
                <p className="text-sm text-ink-700">{item.endpoint}</p>
                <span className="text-sm font-semibold text-ink-900">{item.requests}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Analytics
