import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { adminApi } from './lib/api';
import { isConfigured } from './lib/supabase';
import logo from '../assets/WhatsApp Image 2026-11-06 at 10.46.19 PM.jpeg';
import HomeStats from './components/HomeStats';
import SiteTour from './components/SiteTour';
import SiteFooter from './components/SiteFooter';
import StartupScreen from './components/StartupScreen';
import TasbeehCounter from './components/TasbeehCounter';
import Login from './pages/Login';
import KhatmaList from './pages/KhatmaList';
import KhatmaView from './pages/KhatmaView';
import Account from './pages/Account';
import AdminDashboard from './pages/admin/AdminDashboard';

const TOUR_KEY = 'khatma_tour_seen_v1';

function shouldShowTour() {
  try {
    return localStorage.getItem(TOUR_KEY) !== 'true';
  } catch (error) {
    console.error('تعذر التحقق من حالة الرحلة التعريفية', error);
    return true;
  }
}

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
  const [guestView, setGuestView] = useState('login');
  const [tourOpen, setTourOpen] = useState(shouldShowTour);

  function closeTour() {
    setTourOpen(false);
    try {
      localStorage.setItem(TOUR_KEY, 'true');
    } catch (error) {
      console.error('تعذر حفظ حالة الرحلة التعريفية', error);
    }
  }

  if (!user) {
    if (guestView === 'tasbeeh') {
      return (
        <>
          <div className="app-shell">
            <header className="app-header">
              <button type="button" className="flex items-center gap-3 text-start" onClick={() => setGuestView('login')}>
                <img className="h-11 w-11 rounded-full object-cover" src={logo} alt="" />
                <span className="text-xl font-extrabold text-leaf-700">نختُم معاً</span>
              </button>
              <button type="button" className="btn btn-ghost px-3 py-2 text-sm" onClick={() => setTourOpen(true)}>
                رحلة تعريفية
              </button>
            </header>
            <main><TasbeehCounter onBack={() => setGuestView('login')} /></main>
            <SiteFooter />
          </div>
          {tourOpen && <SiteTour onClose={closeTour} />}
        </>
      );
    }

    return (
      <>
        <Login onOpenTasbeeh={() => setGuestView('tasbeeh')} onStartTour={() => setTourOpen(true)} />
        {tourOpen && <SiteTour onClose={closeTour} />}
      </>
    );
  }

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
      <header className="app-header gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setView({ page: 'home' })}
          className="flex min-w-0 items-center gap-2.5 self-start text-start sm:gap-3"
          aria-label="الصفحة الرئيسية"
        >
          <img className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm sm:h-11 sm:w-11" src={logo} alt="" />
          <span className="min-w-0">
            <span className="block text-lg font-extrabold leading-tight text-leaf-700 sm:text-xl">نختُم معاً</span>
            <span className="block max-w-[65vw] truncate text-xs text-stone-500 sm:max-w-none sm:text-sm">أهلاً {user.name}</span>
          </span>
        </button>
        <nav className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end" aria-label="التنقل الرئيسي">
          <button
            className={`btn min-h-11 px-2 py-2 text-xs sm:px-4 sm:text-sm ${view.page === 'home' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView({ page: 'home' })}
            aria-current={view.page === 'home' ? 'page' : undefined}
          >
            الرئيسية
          </button>
          {isAdmin && (
            <button
              className={`btn min-h-11 px-2 py-2 text-xs sm:px-4 sm:text-sm ${view.page === 'admin' ? 'btn-primary' : 'btn-soft'}`}
              onClick={() => setView({ page: view.page === 'admin' ? 'home' : 'admin' })}
              aria-current={view.page === 'admin' ? 'page' : undefined}
            >
              {view.page === 'admin' ? 'صفحة الختمات' : 'لوحة المشرف'}
            </button>
          )}
          <button
            className={`btn min-h-11 px-2 py-2 text-xs sm:px-4 sm:text-sm ${view.page === 'account' ? 'btn-soft' : 'btn-ghost'}`}
            onClick={() => setView({ page: view.page === 'account' ? 'home' : 'account' })}
            aria-current={view.page === 'account' ? 'page' : undefined}
          >
            حسابي
          </button>
          <button
            className={`btn min-h-11 px-2 py-2 text-xs sm:px-4 sm:text-sm ${view.page === 'tasbeeh' ? 'btn-soft' : 'btn-ghost'}`}
            onClick={() => setView({ page: view.page === 'tasbeeh' ? 'home' : 'tasbeeh' })}
            aria-current={view.page === 'tasbeeh' ? 'page' : undefined}
          >
            المسبحة
          </button>
          <button type="button" className="btn btn-ghost min-h-11 px-2 py-2 text-xs sm:px-4 sm:text-sm" onClick={() => setTourOpen(true)}>
            رحلة تعريفية
          </button>
          <button type="button" className="btn btn-ghost min-h-11 px-2 py-2 text-xs sm:px-4 sm:text-sm" onClick={signOut}>
            خروج
          </button>
        </nav>
      </header>

      <main>
        {view.page === 'home' && (
          <div className="space-y-5 sm:space-y-6">
            <section className="page-hero mb-5">
              <div className="relative z-10 max-w-2xl space-y-2.5">
                <p className="eyebrow">مساحة للخير والأجر</p>
                <h1 className="text-3xl font-extrabold leading-tight text-leaf-700 sm:text-4xl">الختمات المفتوحة</h1>
                <p className="max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
                  اختر جزءاً متاحاً وشارك في إتمام ختمة القرآن الكريم.
                </p>
                <button
                  type="button"
                  onClick={() => document.getElementById('open-khatmas')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="btn btn-primary mt-2 min-h-11 w-full sm:w-auto"
                >
                  تصفح الختمات
                </button>
              </div>
              <span className="pointer-events-none absolute -left-5 -top-5 select-none text-[8rem] leading-none text-leaf-700/[0.06] sm:-left-4 sm:-top-8 sm:text-[9rem]" aria-hidden="true">۞</span>
            </section>
            <blockquote className="card border-leaf-100 bg-gradient-to-l from-leaf-50 to-white px-4 py-5 text-center sm:px-6 sm:py-6">
              <p className="text-xl font-extrabold leading-relaxed text-leaf-800 sm:text-3xl">
                {'{ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا }'}
              </p>
              <cite className="mt-2 block text-sm not-italic text-stone-500">سورة المزمل، الآية ٤</cite>
            </blockquote>
            <HomeStats />
            <section id="open-khatmas" className="scroll-mt-40 space-y-3">
              <div className="flex items-end justify-between gap-3 px-1">
                <div>
                  <p className="eyebrow">ساهم في الأجر</p>
                  <h2 className="text-2xl font-extrabold text-stone-800">الختمات المتاحة</h2>
                </div>
                <span className="hidden text-sm text-stone-500 sm:block">اختر ختمة لمتابعة أجزائها</span>
              </div>
              <KhatmaList onOpen={(id) => setView({ page: 'khatma', id })} />
            </section>
          </div>
        )}
        {view.page === 'khatma' && (
          <KhatmaView key={view.id} khatmaId={view.id} onBack={() => setView({ page: 'home' })} />
        )}
        {view.page === 'account' && <Account onBack={() => setView({ page: 'home' })} />}
        {view.page === 'admin' && isAdmin && <AdminDashboard />}
        {view.page === 'tasbeeh' && <TasbeehCounter onBack={() => setView({ page: 'home' })} />}
      </main>
      <SiteFooter />
      {tourOpen && <SiteTour onClose={closeTour} />}
    </div>
  );
}

export default function App() {
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setStarting(false), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  if (starting) return <StartupScreen />;
  if (!isConfigured) return <MissingConfig />;
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
