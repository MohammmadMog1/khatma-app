import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { STATUS_LABEL } from '../lib/constants';
import ProgressBar from '../components/ProgressBar';
import Notice from '../components/Notice';
import CompletionDua from '../components/CompletionDua';

const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'available', label: 'المتاحة' },
  { id: 'taken', label: 'المحجوزة' },
];

function PartTile({ part, selected, onToggle }) {
  const { number, status, is_mine: mine } = part;
  const base =
    'flex min-h-[82px] flex-col items-center justify-center gap-1 rounded-2xl border p-2 font-bold transition duration-200 sm:min-h-[96px] ';
  let style;
  let label = STATUS_LABEL[status];
  const clickable = status === 'available';

  if (clickable) {
    style = selected
      ? 'border-leaf-700 bg-leaf-700 text-white shadow-md shadow-leaf-700/20'
      : 'border-leaf-200 bg-white text-leaf-700 hover:-translate-y-0.5 hover:border-leaf-500 hover:bg-leaf-50 active:bg-leaf-50';
    label = selected ? 'محدد ✓' : 'متاح';
  } else if (mine) {
    style =
      status === 'completed'
        ? 'border-leaf-200 bg-leaf-50 text-leaf-700'
        : 'border-amber-200 bg-amber-50 text-amber-900';
    label = status === 'completed' ? 'أتممته' : 'حجزك';
  } else {
    style = 'border-sand-200 bg-sand-100/70 text-stone-500';
  }

  return (
    <button
      type="button"
      disabled={!clickable}
      aria-pressed={clickable ? selected : undefined}
      onClick={() => onToggle(number)}
      className={base + style}
    >
      <span className="text-2xl leading-none sm:text-3xl">{number}</span>
      <span className="text-xs font-medium sm:text-sm">{label}</span>
    </button>
  );
}

export default function KhatmaView({ khatmaId, onBack }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.getParts(khatmaId, user.id);
      setData(d);
      setError('');
      // نُبقي في التحديد الأجزاء التي ما زالت متاحة فقط
      setSelected((prev) => {
        const free = new Set(d.parts.filter((p) => p.status === 'available').map((p) => p.number));
        return new Set([...prev].filter((n) => free.has(n)));
      });
    } catch (e) {
      setError(e.message);
    }
  }, [khatmaId, user.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action, okText) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      if (okText) setNotice({ type: 'ok', text: okText });
    } catch (e) {
      setNotice({ type: 'err', text: e.message });
    } finally {
      await load();
      setBusy(false);
    }
  }

  const toggle = (n) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });

  const reserveSelected = () =>
    run(async () => {
      await api.reserve(user.id, khatmaId, [...selected].sort((a, b) => a - b));
      setSelected(new Set());
    }, 'تم حجز الأجزاء، جزاك الله خيراً');

  const cancel = (n) => {
    if (!window.confirm(`هل تريد إلغاء حجز الجزء ${n}؟`)) return;
    run(() => api.cancel(user.id, khatmaId, n), `تم إلغاء حجز الجزء ${n}`);
  };

  const setDone = (n, done) =>
    run(
      () => api.setDone(user.id, khatmaId, n, done),
      done ? `تقبّل الله منك، تم تسجيل إتمام الجزء ${n}` : `تمت إعادة الجزء ${n} إلى «محجوز»`
    );

  if (error) {
    return (
      <div className="space-y-4">
        <Notice notice={{ type: 'err', text: error }} />
        <button className="btn btn-ghost" onClick={onBack}>
          رجوع للختمات
        </button>
      </div>
    );
  }
  if (!data) return <p className="py-10 text-center text-stone-500">جارٍ التحميل...</p>;

  const { khatma, parts } = data;
  const mine = parts.filter((p) => p.is_mine);
  const count = (s) => parts.filter((p) => p.status === s).length;
  const visible = parts.filter((p) =>
    filter === 'all' ? true : filter === 'available' ? p.status === 'available' : p.status !== 'available'
  );

  if (parts.length === 30 && count('completed') === 30) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <button className="btn btn-ghost min-h-11" onClick={onBack}>
          ‹ كل الختمات
        </button>
        <section className="page-hero px-4 py-5 sm:px-8 sm:py-8">
          <p className="eyebrow">اكتملت الختمة</p>
          <h1 className="mt-1 text-2xl font-extrabold text-leaf-700 sm:text-3xl">{khatma.name}</h1>
          <p className="mt-2 text-sm text-stone-600 sm:text-base">تقبّل الله من جميع المشاركين.</p>
        </section>
        <CompletionDua />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${selected.size > 0 ? 'pb-32' : ''}`}>
      <div className="space-y-4">
        <button className="btn btn-ghost" onClick={onBack}>
          ‹ كل الختمات
        </button>
        <div className="page-hero">
          <div className="relative z-10">
            <p className="eyebrow">الختمة رقم {khatma.number}</p>
            <h1 className="mt-1 text-3xl font-extrabold text-leaf-700">{khatma.name}</h1>
            <p className="mt-2 text-base text-stone-600">اختر الأجزاء المتاحة أو تابع إنجاز الأجزاء التي حجزتها.</p>
          </div>
        </div>
        <div className="card space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-extrabold">تقدّم الختمة</h2>
            <span className="rounded-full bg-leaf-50 px-3 py-1 text-sm font-bold text-leaf-700">
              {count('completed')} من {parts.length} مكتمل
            </span>
          </div>
          <ProgressBar completed={count('completed')} reserved={count('reserved')} available={count('available')} />
          <div className="grid grid-cols-3 gap-2">
            <div className="stat-card"><span className="block font-extrabold text-leaf-700">{count('available')}</span><span className="text-xs text-stone-500">متاح</span></div>
            <div className="stat-card"><span className="block font-extrabold text-amber-700">{count('reserved')}</span><span className="text-xs text-stone-500">محجوز</span></div>
            <div className="stat-card"><span className="block font-extrabold text-stone-700">{count('completed')}</span><span className="text-xs text-stone-500">مكتمل</span></div>
          </div>
        </div>
      </div>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      {mine.length > 0 && (
        <section className="card space-y-3">
          <div>
            <p className="eyebrow">متابعة إنجازك</p>
            <h2 className="mt-1 text-xl font-extrabold text-leaf-700">أجزاؤك في هذه الختمة</h2>
          </div>
          <ul className="space-y-3">
            {mine.map((p) => (
              <li
                key={p.number}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand-200/80 bg-sand-50 p-3 sm:p-4"
              >
                <div>
                  <p className="text-xl font-bold">الجزء {p.number}</p>
                  <p className="text-base text-stone-600">
                    {p.status === 'completed' ? 'أتممته ✓' : 'محجوز باسمك'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.status === 'reserved' ? (
                    <>
                      <button className="btn btn-primary" disabled={busy} onClick={() => setDone(p.number, true)}>
                        أتممته
                      </button>
                      <button className="btn btn-danger" disabled={busy} onClick={() => cancel(p.number)}>
                        إلغاء الحجز
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-ghost" disabled={busy} onClick={() => setDone(p.number, false)}>
                      تراجع (لم أتمّه)
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">الأجزاء</h2>
          <div className="flex gap-1 rounded-full border border-sand-200 bg-white/70 p-1" role="group" aria-label="تصفية الأجزاء">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-bold transition sm:px-4 sm:py-2 sm:text-base ${
                  filter === f.id
                    ? 'bg-leaf-700 text-white shadow-sm'
                    : 'text-stone-600 hover:bg-leaf-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-stone-600">اضغط على الجزء المتاح لتحديده، ثم أكّد الحجز.</p>

        {visible.length === 0 ? (
          <p className="card text-center text-stone-600">لا توجد أجزاء في هذه القائمة.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
            {visible.map((p) => (
              <PartTile key={p.number} part={p} selected={selected.has(p.number)} onToggle={toggle} />
            ))}
          </div>
        )}
      </section>

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-leaf-100 bg-white/95 p-3 shadow-[0_-8px_24px_-20px_rgba(46,82,57,0.5)] backdrop-blur-xl sm:p-4">
          <div className="mx-auto flex max-w-5xl gap-2 sm:gap-3">
            <button className="btn btn-primary flex-1 text-base sm:text-lg" disabled={busy} onClick={reserveSelected}>
              {busy ? 'لحظة...' : `احجز (${selected.size})`}
            </button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => setSelected(new Set())}>
              مسح التحديد
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
