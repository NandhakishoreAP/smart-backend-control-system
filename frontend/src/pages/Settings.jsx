function Settings() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <h2 className="font-display text-xl font-semibold">Gateway Settings</h2>
        <div className="mt-6 space-y-4">
          <label className="block text-sm text-ink-700">
            Default Rate Limit
            <input
              className="mt-2 w-full rounded-xl border border-fog-100 bg-white px-4 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              defaultValue="800 rps"
            />
          </label>
          <label className="block text-sm text-ink-700">
            Cache TTL
            <input
              className="mt-2 w-full rounded-xl border border-fog-100 bg-white px-4 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              defaultValue="300s"
            />
          </label>
          <label className="block text-sm text-ink-700">
            Notification Channel
            <select className="mt-2 w-full rounded-xl border border-fog-100 bg-white px-4 py-2 text-sm text-ink-900 outline-none focus:border-mint-400">
              <option>Slack</option>
              <option>Email</option>
              <option>Webhook</option>
            </select>
          </label>
        </div>
        <button className="mt-6 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-fog-50 transition hover:bg-ink-700">
          Save Settings
        </button>
      </div>

      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <h2 className="font-display text-xl font-semibold">Maintenance</h2>
        <div className="mt-6 space-y-4 text-sm text-ink-700">
          <p>Last policy sync: 3 minutes ago</p>
          <p>Cache warmup status: Stable</p>
          <p>Alerts queue depth: 12</p>
        </div>
        <button className="mt-6 rounded-lg border border-fog-100 bg-white px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50">
          Run Health Check
        </button>
      </div>
    </section>
  )
}

export default Settings
