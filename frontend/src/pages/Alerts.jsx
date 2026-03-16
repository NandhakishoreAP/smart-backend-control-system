const alerts = [
  { title: 'Rate-limit policy updated', detail: 'Applied to /billing/*', time: '2m ago', level: 'Info' },
  { title: 'Latency spike detected', detail: 'P95 > 420ms on /notify/*', time: '8m ago', level: 'Warn' },
  { title: 'Auth failures rising', detail: 'X-API-KEY missing 2.1%', time: '20m ago', level: 'Warn' },
]

function Alerts() {
  return (
    <section className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.title}
          className="rounded-2xl border border-fog-100 bg-white/80 p-5 shadow-glass backdrop-blur"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">{alert.title}</p>
              <p className="mt-1 text-xs text-ink-600">{alert.detail}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-600">{alert.time}</p>
              <span className="mt-2 inline-block rounded-full bg-signal-400/20 px-2 py-1 text-xs font-semibold text-signal-600">
                {alert.level}
              </span>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}

export default Alerts
