import { useState } from 'react';
import AdminKhatmas from './AdminKhatmas';
import AdminUsers from './AdminUsers';
import AdminLogs from './AdminLogs';

const TABS = [
  { id: 'khatmas', label: 'الختمات' },
  { id: 'users', label: 'المستخدمون' },
  { id: 'logs', label: 'السجل' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('khatmas');
  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="page-hero px-4 py-5 sm:px-8 sm:py-8">
        <p className="eyebrow">إدارة وتنظيم</p>
        <h1 className="mt-1 text-2xl font-extrabold text-leaf-700 sm:text-3xl">لوحة المشرف</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600 sm:text-base">تابع الختمات والمستخدمين وسجلّ العمليات من مكان واحد.</p>
      </section>
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-sand-200 bg-white/70 p-1.5 shadow-sm sm:gap-2" role="tablist" aria-label="أقسام لوحة المشرف">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-11 rounded-xl px-2 py-2.5 text-sm font-bold transition sm:px-5 sm:text-base ${
              tab === t.id
                ? 'bg-leaf-700 text-white shadow-sm'
                : 'text-stone-600 hover:bg-leaf-50 hover:text-leaf-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'khatmas' && <AdminKhatmas />}
      {tab === 'users' && <AdminUsers />}
      {tab === 'logs' && <AdminLogs />}
    </div>
  );
}
