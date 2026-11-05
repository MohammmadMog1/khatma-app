import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatPhone, isValidPhone, normalizePhone } from '../lib/phone';
import Notice from '../components/Notice';
import PhoneFields, { phonesMatch } from '../components/PhoneFields';

const TITLES = {
  phone: {
    login: { h: 'أهلاً بعودتك', p: 'أدخل رقم هاتفك للمتابعة إلى حسابك' },
    signup: { h: 'أنشئ حسابك', p: 'أدخل بياناتك للانضمام إلى ختمة القرآن' },
  },
  confirm: {
    login: { h: 'تأكيد الرقم', p: 'تأكد أن الرقم صحيح قبل تسجيل الدخول' },
    signup: { h: 'تأكيد الرقم', p: 'تأكد من رقمك لإكمال إنشاء الحساب' },
  },
  name: { h: 'أول مرة عندنا؟', p: 'اكتب اسمك ليظهر في حجوزاتك' },
  pin: { h: 'دخول المشرف', p: 'اكتب الرقم السري' },
};

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [step, setStep] = useState('phone'); // phone | confirm | name | pin
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const normalized = normalizePhone(phone);

  function submitPhone(e) {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && name.trim().length < 2) {
      setError('اكتب اسماً من حرفين على الأقل');
      return;
    }
    if (!isValidPhone(normalized)) {
      setError('رقم الهاتف غير صحيح، تأكد منه وحاول مرة أخرى');
      return;
    }
    if (!phonesMatch(phone, phone2)) {
      setError('الرقمان غير متطابقين، تأكد منهما');
      return;
    }
    setStep('confirm');
  }

  async function callServer(nameValue, pinValue) {
    setError('');
    setBusy(true);
    try {
      const res = await api.login(normalized, nameValue, pinValue);
      switch (res.status) {
        case 'ok':
          login({ user: res.user, token: res.token ?? null });
          break;
        case 'needs_name':
          setStep('name');
          break;
        case 'needs_pin':
          setStep('pin');
          break;
        case 'wrong_pin':
          setPin('');
          setError('الرقم السري غير صحيح');
          break;
        case 'locked':
          setError('تم إيقاف المحاولات مؤقتاً، حاول بعد 15 دقيقة');
          break;
        default:
          setError('حدث خطأ غير متوقع');
      }
    } catch (err) {
      setError(err.message);
      if (step === 'confirm') setStep('phone');
    } finally {
      setBusy(false);
    }
  }

  function submitDetails(e) {
    e.preventDefault();
    callServer(step === 'name' ? name.trim() : null, step === 'pin' ? pin : null);
  }

  function backToPhone() {
    setStep('phone');
    setPin('');
    setError('');
  }

  const currentTitle = step === 'phone' || step === 'confirm' ? TITLES[step][mode] : TITLES[step];

  const header = (
    <header className="space-y-3 text-center">
      <span className="brand-mark mx-auto h-14 w-14 rounded-2xl text-2xl" aria-hidden="true">خ</span>
      <div>
        <p className="eyebrow">ختمة القرآن</p>
        <h1 className="mt-1 text-3xl font-extrabold text-leaf-700">{currentTitle.h}</h1>
        <p className="mt-1 text-base text-stone-600">{currentTitle.p}</p>
      </div>
    </header>
  );

  const errorBox = <Notice notice={error ? { type: 'err', text: error } : null} />;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <span className="pointer-events-none absolute -right-10 top-10 select-none text-[14rem] leading-none text-leaf-700/[0.045]" aria-hidden="true">۞</span>
      {step === 'phone' && (
        <form onSubmit={submitPhone} className="card relative z-10 w-full max-w-md space-y-6 p-6 sm:p-8">
          {header}
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-sand-200 bg-sand-50 p-1" role="tablist" aria-label="اختيار الدخول أو إنشاء حساب">
            {[
              { id: 'login', label: 'تسجيل الدخول' },
              { id: 'signup', label: 'إنشاء حساب' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={mode === option.id}
                onClick={() => {
                  setMode(option.id);
                  setError('');
                }}
                className={`rounded-xl px-3 py-2.5 text-sm font-bold transition sm:text-base ${
                  mode === option.id ? 'bg-white text-leaf-700 shadow-sm' : 'text-stone-500 hover:text-leaf-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {mode === 'signup' && (
            <label className="form-label">
              <span>الاسم</span>
              <input
                className="input"
                type="text"
                autoComplete="name"
                placeholder="مثال: أبو أحمد"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                required
              />
            </label>
          )}
          <PhoneFields phone={phone} confirm={phone2} onPhone={setPhone} onConfirm={setPhone2} autoFocus />
          {errorBox}
          <button className="btn btn-primary w-full text-lg">
            {mode === 'signup' ? 'متابعة إنشاء الحساب' : 'متابعة تسجيل الدخول'}
          </button>
        </form>
      )}

      {step === 'confirm' && (
        <div className="card relative z-10 w-full max-w-md space-y-6 p-6 sm:p-8">
          {header}
          <div className="rounded-2xl border border-leaf-200 bg-leaf-50 p-5 text-center">
            <p className="text-sm text-stone-600">رقمك الذي كتبته</p>
            <p className="mt-1 text-4xl font-extrabold tracking-wider text-leaf-700" dir="ltr">
              {formatPhone(normalized)}
            </p>
          </div>
          <p className="text-center text-base leading-relaxed">
            هذا الرقم هو مفتاح دخولك في كل مرة. <strong>هل هو رقمك الصحيح؟</strong>
          </p>
          {errorBox}
          <button
            className="btn btn-primary w-full text-lg"
            disabled={busy}
            onClick={() => callServer(mode === 'signup' ? name.trim() : null, null)}
          >
            {busy ? 'لحظة...' : mode === 'signup' ? 'تأكيد وإنشاء الحساب' : 'تأكيد وتسجيل الدخول'}
          </button>
          <button className="btn btn-ghost w-full" disabled={busy} onClick={backToPhone}>
            لا، أريد تعديل الرقم
          </button>
        </div>
      )}

      {(step === 'name' || step === 'pin') && (
        <form onSubmit={submitDetails} className="card relative z-10 w-full max-w-md space-y-6 p-6 sm:p-8">
          {header}
          <div className="rounded-2xl border border-sand-200 bg-sand-50 p-4 text-center">
            <p className="text-sm text-stone-600">رقم الهاتف</p>
            <p className="text-2xl font-bold tracking-wider" dir="ltr">
              {formatPhone(normalized)}
            </p>
          </div>

          {step === 'name' && (
            <label className="form-label">
              <span>الاسم</span>
              <input
                className="input"
                type="text"
                autoComplete="name"
                placeholder="مثال: أبو أحمد"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
                minLength={2}
              />
            </label>
          )}

          {step === 'pin' && (
            <label className="form-label">
              <span>الرقم السري</span>
              <input
                className="input text-center tracking-[0.5em]"
                dir="ltr"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                required
              />
            </label>
          )}

          {errorBox}
          <button className="btn btn-primary w-full text-lg" disabled={busy}>
            {busy ? 'لحظة...' : step === 'name' ? 'ابدأ' : 'دخول'}
          </button>
          <button type="button" className="btn btn-ghost w-full" onClick={backToPhone}>
            تغيير رقم الهاتف
          </button>
        </form>
      )}
    </main>
  );
}
