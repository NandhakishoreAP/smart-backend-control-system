function SubscriptionCard({ name, description, subscribedAt, status, onUnsubscribe, disabling }) {
  return (
    <div className="flex h-full min-h-[180px] flex-col justify-between rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-semibold text-ink-900">{name}</p>
          <span className="rounded-full bg-mint-400/20 px-2 py-1 text-xs font-semibold text-mint-600">
            {status}
          </span>
        </div>
        <p className="mt-2 text-sm text-ink-600">{description}</p>
        <p className="mt-3 text-xs text-ink-600">Subscribed {subscribedAt}</p>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onUnsubscribe}
          disabled={disabling}
          className="flex items-center justify-between rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-xs font-semibold text-ink-800 transition hover:bg-fog-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {disabling ? 'Unsubscribing...' : 'Unsubscribe'}
        </button>
      </div>
    </div>
  )
}

export default SubscriptionCard
