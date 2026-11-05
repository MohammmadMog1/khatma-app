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
    <div className="space-y-5">
      <section className="page-hero">
        <p className="eyebrow">إدارة وتنظيم</p>
        <h1 className="mt-1 text-3xl font-extrabold text-leaf-700">لوحة المشرف</h1>
        <p className="mt-2 text-base text-stone-600">تابع الختمات والمستخدمين وسجلّ العمليات من مكان واحد.</p>
      </section>
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-sand-200 bg-white/60 p-1.5" role="tablist" aria-label="أقسام لوحة المشرف">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-xl px-5 py-2.5 text-base font-bold transition ${
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
