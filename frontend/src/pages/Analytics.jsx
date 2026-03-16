const insights = [
  { label: 'Peak RPS', value: '1.9k', trend: '+6%' },
  { label: 'P95 Latency', value: '340ms', trend: '-12ms' },
  { label: 'Cache Hit', value: '92%', trend: '+2%' },
]

const traffic = [
  { label: 'APIs with spikes', value: '4' },
  { label: 'Top region', value: 'ap-south-1' },
  { label: 'Partner calls', value: '18%' },
]

function Analytics() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {insights.map((item) => (
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

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
          <h2 className="font-display text-xl font-semibold">Traffic Pulse</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {['/billing/summary', '/devices/telemetry', '/notify/push', '/identity/login'].map((route) => (
              <div key={route} className="rounded-2xl border border-fog-100 bg-fog-50 px-4 py-3">
                <p className="text-sm font-semibold text-ink-900">{route}</p>
                <p className="mt-1 text-xs text-ink-600">Latency stable, 0.2% error rate</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
          <h2 className="font-display text-xl font-semibold">Traffic Mix</h2>
          <div className="mt-6 space-y-4">
            {traffic.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <p className="text-sm text-ink-700">{item.label}</p>
                <span className="text-sm font-semibold text-ink-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Analytics
