import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatPhone, isValidPhone, normalizePhone } from '../lib/phone';
import Notice from '../components/Notice';
import PhoneFields, { phonesMatch } from '../components/PhoneFields';

export default function Account({ onBack }) {
  const { user, token, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .getProfile(user.id)
      .then((p) => {
        if (!alive) return;
        setProfile(p);
        setName(p.name);
        setPhone(formatPhone(p.phone));
      })
      .catch((e) => alive && setNotice({ type: 'err', text: e.message }));
    return () => {
      alive = false;
    };
  }, [user.id]);

  if (!profile) {
    return notice ? <Notice notice={notice} /> : <p className="py-10 text-center text-stone-500">جارٍ التحميل...</p>;
  }

  const normalized = normalizePhone(phone);
  const phoneChanged = normalized !== profile.phone;
  const dirty = phoneChanged || name.trim() !== profile.name;

  async function save(e) {
    e.preventDefault();
    setNotice(null);
    if (name.trim().length < 2) return setNotice({ type: 'err', text: 'اكتب اسماً من حرفين على الأقل' });
    if (!isValidPhone(normalized)) return setNotice({ type: 'err', text: 'رقم الهاتف غير صحيح' });
    if (phoneChanged) {
      if (!phonesMatch(phone, phone2)) return setNotice({ type: 'err', text: 'الرقمان غير متطابقين' });
      const ok = window.confirm(
        `سيصبح رقم دخولك الجديد:\n${formatPhone(normalized)}\n\nهل هذا الرقم صحيح؟`
      );
      if (!ok) return;
    }
    setBusy(true);
    try {
      const res = await api.updateProfile(user.id, name.trim(), normalized, token);
      setProfile(res);
      setName(res.name);
      setPhone(formatPhone(res.phone));
      setPhone2('');
      updateUser({ name: res.name });
      setNotice({ type: 'ok', text: 'تم حفظ بياناتك' });
    } catch (err) {
      setNotice({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <button className="btn btn-ghost" onClick={onBack}>
        ‹ الرجوع للختمات
      </button>
      <section className="page-hero">
        <p className="eyebrow">بياناتك الشخصية</p>
        <h1 className="mt-1 text-3xl font-extrabold text-leaf-700">حسابي</h1>
        <p className="mt-2 text-base text-stone-600">حدّث اسمك ورقم هاتفك المستخدم للدخول.</p>
      </section>

      <form onSubmit={save} className="card space-y-5 sm:p-7">
        <label className="form-label">
          <span>الاسم</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            required
          />
        </label>

        <PhoneFields
          phone={phone}
          confirm={phone2}
          onPhone={setPhone}
          onConfirm={setPhone2}
          needConfirm={phoneChanged}
        />
        {phoneChanged && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            ستدخل بالرقم الجديد من الآن فصاعداً. حجوزاتك الحالية تبقى كما هي.
          </p>
        )}

        <Notice notice={notice} onClose={() => setNotice(null)} />
        <button className="btn btn-primary w-full text-xl" disabled={busy || !dirty}>
          {busy ? 'لحظة...' : 'حفظ التعديلات'}
        </button>
      </form>
    </div>
  );
}
