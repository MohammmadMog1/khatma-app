import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import ProgressBar from '../components/ProgressBar';
import Notice from '../components/Notice';

export default function KhatmaList({ onOpen }) {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .listKhatmas(user.id)
      .then((d) => alive && setItems(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [user.id]);

  if (error) return <Notice notice={{ type: 'err', text: error }} />;
  if (!items) {
    return (
      <div className="space-y-3" aria-label="جارٍ تحميل الختمات">
        {[1, 2].map((item) => (
          <div key={item} className="card animate-pulse space-y-4">
            <div className="h-4 w-24 rounded bg-sand-200" />
            <div className="h-7 w-2/3 rounded bg-sand-200" />
            <div className="h-3 rounded-full bg-sand-200" />
          </div>
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="card border-dashed py-10 text-center">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-leaf-50 text-2xl text-leaf-700" aria-hidden="true">۞</span>
        <p className="text-xl font-extrabold">لا توجد ختمة مفتوحة الآن</p>
        <p className="mt-2 text-base text-stone-600">عندما يفتح المشرف ختمة جديدة ستظهر هنا.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {items.map((k) => (
        <li key={k.id}>
          <button
            type="button"
            onClick={() => onOpen(k.id)}
            className="group card w-full space-y-4 text-start transition duration-200 hover:-translate-y-0.5 hover:border-leaf-300 hover:shadow-lg active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow">الختمة رقم {k.number}</p>
                <h2 className="mt-1 truncate text-xl font-extrabold sm:text-2xl">{k.name}</h2>
              </div>
              {k.mine > 0 && (
                <span className="shrink-0 rounded-full bg-leaf-100 px-3 py-1.5 text-sm font-bold text-leaf-700">
                  أجزاؤك: {k.mine}
                </span>
              )}
            </div>
            <ProgressBar completed={k.completed} reserved={k.reserved} available={k.available} />
            <div className="grid grid-cols-3 gap-2">
              <div className="stat-card">
                <span className="block text-lg font-extrabold text-leaf-700">{k.available}</span>
                <span className="text-xs text-stone-500 sm:text-sm">متاح</span>
              </div>
              <div className="stat-card">
                <span className="block text-lg font-extrabold text-amber-700">{k.reserved}</span>
                <span className="text-xs text-stone-500 sm:text-sm">محجوز</span>
              </div>
              <div className="stat-card">
                <span className="block text-lg font-extrabold text-stone-700">{k.completed}</span>
                <span className="text-xs text-stone-500 sm:text-sm">مكتمل</span>
              </div>
            </div>
            <p className="flex items-center justify-between text-sm font-bold text-leaf-700">
              <span>عرض الأجزاء والحجز</span>
              <span className="transition group-hover:-translate-x-1" aria-hidden="true">←</span>
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
