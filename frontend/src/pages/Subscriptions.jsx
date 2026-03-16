const plans = [
  { name: 'Starter', calls: '100k / month', price: '$49', status: 'Active' },
  { name: 'Growth', calls: '1M / month', price: '$299', status: 'Active' },
  { name: 'Enterprise', calls: 'Custom', price: 'Contact', status: 'Draft' },
]

function Subscriptions() {
  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">{plan.name}</h2>
            <span className="rounded-full bg-ink-900 px-2 py-1 text-xs text-fog-50">{plan.status}</span>
          </div>
          <p className="mt-4 text-sm text-ink-600">Usage</p>
          <p className="text-lg font-semibold text-ink-900">{plan.calls}</p>
          <p className="mt-6 text-sm text-ink-600">Price</p>
          <p className="text-lg font-semibold text-ink-900">{plan.price}</p>
          <div className="mt-6 flex gap-3">
            <button className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50">
              Manage
            </button>
            <button className="rounded-lg bg-ink-900 px-3 py-2 text-sm font-semibold text-fog-50 transition hover:bg-ink-700">
              View
            </button>
          </div>
        </div>
      ))}
    </section>
  )
}

export default Subscriptions
