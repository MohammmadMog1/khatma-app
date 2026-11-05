// شريط تقدّم: تمّ (أخضر غامق) / محجوز (أخضر فاتح) / متاح (فارغ)
export default function ProgressBar({ completed = 0, reserved = 0, available = 0 }) {
  const total = completed + reserved + available || 1;
  const pct = (n) => `${(n / total) * 100}%`;
  return (
    <div
      className="flex h-3 w-full overflow-hidden rounded-full bg-sand-200"
      role="img"
      aria-label={`تمّ ${completed}، محجوز ${reserved}، متاح ${available}`}
    >
      <div className="bg-leaf-700" style={{ width: pct(completed) }} />
      <div className="bg-leaf-500/50" style={{ width: pct(reserved) }} />
    </div>
  );
}
