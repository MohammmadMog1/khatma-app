import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { adminApi } from './lib/api';
import { isConfigured } from './lib/supabase';
import Login from './pages/Login';
import KhatmaList from './pages/KhatmaList';
import KhatmaView from './pages/KhatmaView';
import Account from './pages/Account';
import AdminDashboard from './pages/admin/AdminDashboard';

function MissingConfig() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md space-y-3 text-center" dir="rtl">
        <h1 className="text-2xl font-extrabold">الإعداد غير مكتمل</h1>
        <p>
          أنشئ ملف <code dir="ltr">.env</code> في جذر المشروع وضع فيه <code dir="ltr">VITE_SUPABASE_URL</code> و
          <code dir="ltr"> VITE_SUPABASE_ANON_KEY</code> (راجع ملف README)، ثم أعد تشغيل المشروع.
        </p>
      </div>
    </main>
  );
}

function Shell() {
  const { user, token, isAdmin, logout } = useAuth();
  const [view, setView] = useState({ page: 'home' });

  if (!user) return <Login />;

  async function signOut() {
    if (!window.confirm('هل تريد الخروج من الموقع؟')) return;

    if (token) {
      try {
        await adminApi(token).logout();
      } catch {
        /* نتجاهل: سنخرج محلياً في كل الأحوال */
      }
    }
    setView({ page: 'home' });
    logout();
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          type="button"
          onClick={() => setView({ page: 'home' })}
          className="flex min-w-0 items-center gap-3 text-start"
          aria-label="الصفحة الرئيسية"
        >
          <span className="brand-mark" aria-hidden="true">خ</span>
          <span className="min-w-0">
            <span className="block text-xl font-extrabold leading-tight text-leaf-700">ختمة القرآن</span>
            <span className="block truncate text-sm text-stone-500">أهلاً {user.name}</span>
          </span>
        </button>
        <nav className="flex flex-wrap items-center gap-2" aria-label="التنقل الرئيسي">
          {isAdmin && (
            <button
              className={`btn px-3 py-2 text-sm sm:px-4 ${view.page === 'admin' ? 'btn-primary' : 'btn-soft'}`}
              onClick={() => setView({ page: view.page === 'admin' ? 'home' : 'admin' })}
            >
              {view.page === 'admin' ? 'صفحة الختمات' : 'لوحة المشرف'}
            </button>
          )}
          <button
            className={`btn px-3 py-2 text-sm sm:px-4 ${view.page === 'account' ? 'btn-soft' : 'btn-ghost'}`}
            onClick={() => setView({ page: view.page === 'account' ? 'home' : 'account' })}
          >
            حسابي
          </button>
          <button className="btn btn-ghost px-3 py-2 text-sm sm:px-4" onClick={signOut}>
            خروج
          </button>
        </nav>
      </header>

      <main>
        {view.page === 'home' && (
          <div className="space-y-4">
            <section className="page-hero mb-6">
              <div className="relative z-10 max-w-2xl space-y-2">
                <p className="eyebrow">مساحة للخير والأجر</p>
                <h1 className="text-3xl font-extrabold leading-tight text-leaf-700 sm:text-4xl">الختمات المفتوحة</h1>
                <p className="text-base leading-relaxed text-stone-600 sm:text-lg">
                  اختر جزءاً متاحاً وشارك في إتمام ختمة القرآن الكريم.
                </p>
              </div>
              <span className="pointer-events-none absolute -left-4 -top-8 select-none text-[9rem] leading-none text-leaf-700/[0.06]" aria-hidden="true">۞</span>
            </section>
            <KhatmaList onOpen={(id) => setView({ page: 'khatma', id })} />
          </div>
        )}
        {view.page === 'khatma' && (
          <KhatmaView key={view.id} khatmaId={view.id} onBack={() => setView({ page: 'home' })} />
        )}
        {view.page === 'account' && <Account onBack={() => setView({ page: 'home' })} />}
        {view.page === 'admin' && isAdmin && <AdminDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  if (!isConfigured) return <MissingConfig />;
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
