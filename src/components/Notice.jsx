export default function Notice({ notice, onClose }) {
  if (!notice) return null;
  const ok = notice.type === 'ok';
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={`flex items-start justify-between gap-3 rounded-2xl border-2 px-4 py-3 font-medium ${
        ok ? 'border-leaf-500 bg-leaf-50 text-leaf-700' : 'border-red-300 bg-red-50 text-red-800'
      }`}
    >
      <span>{notice.text}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="shrink-0 text-xl leading-none" aria-label="إغلاق">
          ×
        </button>
      )}
    </div>
  );
}
