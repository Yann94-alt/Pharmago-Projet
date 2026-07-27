export default function Alert({ type = 'info', children, onClose }) {
  if (!children) return null

  const styles = {
    error: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-brand-50 text-brand-700 border-brand-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  }

  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>
      <span>{children}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  )
}
