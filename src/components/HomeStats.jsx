import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Notice from './Notice';

export default function HomeStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .getKhatmaStats()
      .then((result) => alive && setStats(result))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <Notice notice={{ type: 'err', text: error }} />;
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3" aria-label="جارٍ تحميل إحصاءات الختمات">
        {[1, 2].map((item) => (
          <div key={item} className="card animate-pulse space-y-3 text-center">
            <div className="mx-auto h-8 w-12 rounded bg-sand-200" />
            <div className="mx-auto h-4 w-24 rounded bg-sand-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-3" aria-label="إحصاءات الختمات">
      <div className="stat-card flex min-h-24 items-center gap-3 rounded-3xl bg-white p-3 text-start shadow-sm sm:min-h-28 sm:gap-4 sm:p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-leaf-50 text-2xl text-leaf-700 sm:h-14 sm:w-14" aria-hidden="true">۞</span>
        <span>
          <span className="block text-2xl font-extrabold leading-tight text-leaf-700 sm:text-3xl">{stats.ongoing}</span>
          <span className="mt-1 block text-sm font-bold text-stone-600 sm:text-base">ختمات جارية</span>
        </span>
      </div>
      <div className="stat-card flex min-h-24 items-center gap-3 rounded-3xl bg-white p-3 text-start shadow-sm sm:min-h-28 sm:gap-4 sm:p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-2xl text-amber-700" aria-hidden="true">✓</span>
        <span>
          <span className="block text-2xl font-extrabold leading-tight text-amber-700 sm:text-3xl">{stats.completed}</span>
          <span className="mt-1 block text-sm font-bold text-stone-600 sm:text-base">ختمات منجزة</span>
        </span>
      </div>
    </section>
  );
}
