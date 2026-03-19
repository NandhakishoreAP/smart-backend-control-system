import { Link } from 'react-router-dom'

function ApiCard({ name, description, rateLimit, slug, subscribed, version }) {
  return (
    <Link
      to={`/apis/${slug}`}
      className="group flex h-full min-h-[140px] flex-col rounded-xl bg-white p-6 text-left shadow transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink-900">{name}</h3>
          {version && (
            <span className="mt-2 inline-flex items-center rounded-full bg-fog-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700">
              {version}
            </span>
          )}
        </div>
        <span className="rounded-full bg-ink-900 px-2 py-1 text-xs font-semibold text-fog-50">
          {rateLimit} rpm
        </span>
      </div>
      <p className="mt-3 text-sm text-ink-600">{description}</p>
      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-900 transition group-hover:bg-fog-50">
            View API
          </span>
          {subscribed && (
            <span className="rounded-full bg-ink-900/10 px-2 py-1 text-xs font-semibold text-ink-700">
              Subscribed
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ApiCard
