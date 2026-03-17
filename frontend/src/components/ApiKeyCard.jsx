function ApiKeyCard({ apiKey, createdAt, status, onCopy, onDelete, deleting }) {
  return (
    <div className="flex h-full min-h-[180px] flex-col justify-between rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-600">API Key</p>
          <span className="rounded-full bg-mint-400/20 px-2 py-1 text-xs font-semibold text-mint-600">
            {status}
          </span>
        </div>
        <p className="mt-3 text-lg font-semibold text-ink-900">{apiKey}</p>
        <p className="mt-2 text-xs text-ink-600">Created {createdAt}</p>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center justify-between rounded-lg border border-fog-100 bg-white px-3 py-2 text-xs font-semibold text-ink-800 transition hover:bg-fog-50"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="flex items-center justify-between rounded-lg border border-signal-400/30 bg-signal-400/10 px-3 py-2 text-xs font-semibold text-ink-900 transition hover:bg-signal-400/20 disabled:cursor-not-allowed"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

export default ApiKeyCard
