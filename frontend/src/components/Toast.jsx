import { useEffect } from 'react'

function Toast({ message, visible, onClose, duration = 1800 }) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [visible, onClose, duration])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-xl border border-mint-400/40 bg-mint-400/15 px-4 py-2 text-sm font-semibold text-ink-900 shadow-glass transition duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}

export default Toast
