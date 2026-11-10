import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../lib/api';
import { formatDate } from '../../lib/constants';
import { formatPhone, isValidPhone, normalizePhone } from '../../lib/phone';
import Notice from '../../components/Notice';
import PhoneFields, { phonesMatch } from '../../components/PhoneFields';

export default function AdminUsers() {
  const { token, user: me } = useAuth();
  const admin = useMemo(() => adminApi(token), [token]);
  const [users, setUsers] = useState(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState({ phone: '', name: '', pin: '' });
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editing, setEditing] = useState(null); // { id, name, phone, phone2, original }

  const load = useCallback(async () => {
    try {
      setUsers(await admin.listUsers());
    } catch (e) {
      setNotice({ type: 'err', text: e.message });
    }
  }, [admin]);

  useEffect(() => {
    load();
  }, [load]);

  async function addAdmin(e) {
    e.preventDefault();
    const phone = normalizePhone(form.phone);
    if (!isValidPhone(phone)) return setNotice({ type: 'err', text: 'رقم الهاتف غير صحيح' });
    setBusy(true);
    try {
      await admin.addAdmin(phone, form.name.trim(), form.pin);
      setForm({ phone: '', name: '', pin: '' });
      setNotice({ type: 'ok', text: 'تمت إضافة الأدمن' });
      await load();
    } catch (err) {
      setNotice({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    const phone = normalizePhone(editing.phone);
    if (!isValidPhone(phone)) return setNotice({ type: 'err', text: 'رقم الهاتف غير صحيح' });
    const changed = phone !== editing.original;
    if (changed) {
      if (!phonesMatch(editing.phone, editing.phone2)) {
        return setNotice({ type: 'err', text: 'الرقمان غير متطابقين' });
      }
      if (!window.confirm(`سيصبح رقم دخوله:\n${formatPhone(phone)}\n\nهل هذا الرقم صحيح؟`)) return;
    }
    try {
      await admin.updateUser(editing.id, editing.name.trim(), phone);
      setEditing(null);
      setNotice({ type: 'ok', text: 'تم حفظ التعديل' });
      await load();
    } catch (err) {
      setNotice({ type: 'err', text: err.message });
    }
  }

  async function removeAdmin(u) {
    if (!window.confirm(`إزالة صلاحية الأدمن من ${u.name}؟`)) return;
    try {
      await admin.removeAdmin(u.id);
      await load();
    } catch (err) {
      setNotice({ type: 'err', text: err.message });
    }
  }

  async function deleteUser(u) {
    const confirmed = window.confirm(
      `حذف حساب ${u.name} نهائياً؟\n\nسيتم تحرير أجزائه المحجوزة، والإبقاء على الأجزاء المنجزة دون ربطها بحسابه. كما ستحذف السجلات المرتبطة بحسابه. لا يمكن التراجع عن هذا الإجراء.`
    );
    if (!confirmed) return;

    setDeletingId(u.id);
    try {
      await admin.deleteUser(u.id);
      setNotice({ type: 'ok', text: `تم حذف حساب ${u.name}` });
      await load();
    } catch (err) {
      setNotice({ type: 'err', text: err.message });
    } finally {
      setDeletingId(null);
    }
  }

  const q = query.trim();
  const list = (users || []).filter(
    (u) => !q || u.name.includes(q) || u.phone.includes(normalizePhone(q) || q)
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <form onSubmit={addAdmin} className="card space-y-4 p-4 sm:p-6">
        <div>
          <p className="eyebrow">الصلاحيات</p>
          <h2 className="mt-1 text-lg font-extrabold sm:text-xl">إضافة أدمن</h2>
        </div>
        <p className="text-sm leading-relaxed text-stone-600">
          اكتب رقم هاتفه ورقماً سرياً من 6 أرقام. إن لم يكن مسجلاً من قبل فاكتب اسمه أيضاً.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="input"
            dir="ltr"
            type="tel"
            inputMode="numeric"
            placeholder="رقم الهاتف"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="الاسم (للمستخدم الجديد)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="input"
            dir="ltr"
            inputMode="numeric"
            maxLength={6}
            placeholder="PIN من 6 أرقام"
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value })}
            required
          />
        </div>
        <button className="btn btn-primary min-h-11 w-full sm:w-auto" disabled={busy}>
          {busy ? 'لحظة...' : 'إضافة أدمن'}
        </button>
      </form>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <label className="block space-y-2">
        <span className="text-sm font-bold text-stone-600">البحث عن مستخدم</span>
        <input
          className="input min-h-12"
          type="search"
          placeholder="اكتب الاسم أو رقم الهاتف"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {!users ? (
        <p className="py-6 text-center text-stone-500">جارٍ التحميل...</p>
      ) : list.length === 0 ? (
        <p className="card text-center text-stone-600">لا توجد نتائج.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {list.map((u) => (
            <li key={u.id} className="card space-y-4 p-4 transition hover:shadow-md sm:p-5">
              {editing?.id === u.id ? (
                <form onSubmit={saveEdit} className="space-y-4">
                  <label className="block space-y-2">
                    <span className="font-bold">الاسم</span>
                    <input
                      className="input"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      minLength={2}
                      required
                    />
                  </label>
                  <PhoneFields
                    phone={editing.phone}
                    confirm={editing.phone2}
                    onPhone={(v) => setEditing({ ...editing, phone: v })}
                    onConfirm={(v) => setEditing({ ...editing, phone2: v })}
                    needConfirm={normalizePhone(editing.phone) !== editing.original}
                  />
                  <div className="flex gap-2">
                    <button className="btn btn-primary">حفظ</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                      إلغاء
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
                      {u.name}
                      {u.role === 'admin' && (
                        <span className="rounded-full bg-leaf-100 px-2.5 py-1 text-xs font-bold text-leaf-700">أدمن</span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-stone-600" dir="ltr" style={{ textAlign: 'start' }}>
                      {formatPhone(u.phone)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
                      <span className="rounded-full bg-sand-50 px-3 py-1.5">أجزاء حالية: {u.parts_count}</span>
                      <span className="rounded-full bg-sand-50 px-3 py-1.5">انضم {formatDate(u.created_at)}</span>
                    </div>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                    <button
                      type="button"
                      className="btn btn-ghost min-h-11 px-3 py-2 text-sm"
                      onClick={() =>
                        setEditing({
                          id: u.id,
                          name: u.name,
                          phone: formatPhone(u.phone),
                          phone2: '',
                          original: u.phone,
                        })
                      }
                    >
                      تعديل
                    </button>
                    {u.role === 'admin' && u.id !== me.id && (
                      <button type="button" className="btn btn-danger min-h-11 px-3 py-2 text-sm" onClick={() => removeAdmin(u)}>
                        إزالة من الأدمن
                      </button>
                    )}
                    {u.id !== me.id && (
                      <button
                        type="button"
                        className="btn btn-danger min-h-11 px-3 py-2 text-sm"
                        disabled={deletingId !== null}
                        onClick={() => deleteUser(u)}
                      >
                        {deletingId === u.id ? 'جارٍ الحذف...' : 'حذف الحساب'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
