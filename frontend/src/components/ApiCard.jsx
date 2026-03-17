import { Link } from 'react-router-dom'

function ApiCard({ name, description, rateLimit, slug, subscribed }) {
  return (
    <Link
      to={`/apis/${slug}`}
      className="group flex h-full flex-col rounded-2xl border border-fog-100 bg-white/85 p-5 text-left shadow-glass transition hover:-translate-y-0.5 hover:border-mint-400/60 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-lg font-semibold text-ink-900">{name}</h3>
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
            <span className="rounded-full bg-mint-400/20 px-2 py-1 text-xs font-semibold text-mint-600">
              Subscribed
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ApiCard
