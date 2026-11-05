import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../lib/api';
import { STATUS_LABEL, formatDate } from '../../lib/constants';
import { formatPhone } from '../../lib/phone';
import ProgressBar from '../../components/ProgressBar';
import Notice from '../../components/Notice';

function KhatmaDetail({ khatmaId, onBack }) {
  const { token } = useAuth();
  const admin = useMemo(() => adminApi(token), [token]);
  const [data, setData] = useState(null);
  const [notice, setNotice] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setData(await admin.getParts(khatmaId));
    } catch (e) {
      setNotice({ type: 'err', text: e.message });
    }
  }, [admin, khatmaId]);

  useEffect(() => {
    load();
  }, [load]);

  async function revoke(p) {
    if (!window.confirm(`سحب الجزء ${p.number} من ${p.user_name}؟`)) return;
    try {
      await admin.revoke(khatmaId, p.number);
      setNotice({ type: 'ok', text: `تم سحب الجزء ${p.number} وأصبح متاحاً` });
    } catch (e) {
      setNotice({ type: 'err', text: e.message });
    }
    load();
  }

  if (!data) return <p className="py-8 text-center text-stone-500">جارٍ التحميل...</p>;
  const parts = data.parts.filter((p) => filter === 'all' || p.status === filter);

  return (
    <div className="space-y-4">
      <button className="btn btn-ghost" onClick={onBack}>
        ‹ كل الختمات
      </button>
      <div className="page-hero">
        <p className="text-sm font-medium text-leaf-600">
          الختمة رقم {data.khatma.number} · {data.khatma.is_open ? 'مفعّلة' : 'موقوفة'}
        </p>
        <h2 className="mt-1 text-2xl font-extrabold text-leaf-700">{data.khatma.name}</h2>
        <p className="mt-2 text-sm text-stone-600">عرض حالة كل جزء وبيانات الحجز وإدارة الحجوزات.</p>
      </div>
      <Notice notice={notice} onClose={() => setNotice(null)} />

      <div className="flex flex-wrap gap-2">
        {['all', 'available', 'reserved', 'completed'].map((s) => (
          <button
            key={s}
            aria-pressed={filter === s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              filter === s ? 'bg-leaf-700 text-white shadow-sm' : 'border border-sand-200 bg-white text-stone-600 hover:bg-leaf-50'
            }`}
          >
            {s === 'all' ? 'الكل' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <ul className="space-y-3 sm:hidden">
        {parts.map((p) => (
          <li key={p.number} className="card space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-extrabold">الجزء {p.number}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                p.status === 'completed' ? 'bg-leaf-100 text-leaf-700' :
                p.status === 'reserved' ? 'bg-amber-50 text-amber-800' : 'bg-sand-100 text-stone-600'
              }`}>
                {STATUS_LABEL[p.status]}
              </span>
            </div>
            <div className="grid gap-2 text-sm text-stone-600">
              <p><span className="font-bold text-stone-700">الاسم: </span>{p.user_name || '—'}</p>
              <p dir="ltr" className="text-start"><span className="font-bold text-stone-700">الهاتف: </span>{p.user_phone ? formatPhone(p.user_phone) : '—'}</p>
              <p><span className="font-bold text-stone-700">تاريخ الحجز: </span>{formatDate(p.reserved_at)}</p>
            </div>
            {p.status !== 'available' && (
              <button className="btn btn-danger w-full text-sm" onClick={() => revoke(p)}>
                سحب الحجز
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="card hidden overflow-x-auto p-0 sm:block">
        <table className="w-full min-w-[640px] text-start text-sm">
          <thead className="bg-leaf-50 text-stone-700">
            <tr>
              <th className="px-4 py-3 text-start">الجزء</th>
              <th className="px-4 py-3 text-start">الحالة</th>
              <th className="px-4 py-3 text-start">الاسم</th>
              <th className="px-4 py-3 text-start">الهاتف</th>
              <th className="px-4 py-3 text-start">تاريخ الحجز</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.number} className="border-t border-sand-100 transition hover:bg-sand-50/70">
                <td className="px-4 py-3 font-bold">{p.number}</td>
                <td className="px-4 py-3">{STATUS_LABEL[p.status]}</td>
                <td className="px-4 py-3">{p.user_name || '—'}</td>
                <td className="px-4 py-3" dir="ltr">
                  <span className="inline-block text-start">{p.user_phone ? formatPhone(p.user_phone) : '—'}</span>
                </td>
                <td className="px-4 py-3">{formatDate(p.reserved_at)}</td>
                <td className="px-4 py-3 text-end">
                  {p.status !== 'available' && (
                    <button className="btn btn-danger px-3 py-1.5 text-base" onClick={() => revoke(p)}>
                      سحب الحجز
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminKhatmas() {
  const { token } = useAuth();
  const admin = useMemo(() => adminApi(token), [token]);
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null); // { id, name }

  const load = useCallback(async () => {
    try {
      setItems(await admin.listKhatmas());
    } catch (e) {
      setNotice({ type: 'err', text: e.message });
    }
  }, [admin]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await admin.createKhatma(name);
      setName('');
      setNotice({ type: 'ok', text: 'تم إنشاء الختمة بأجزائها الثلاثين' });
      await load();
    } catch (err) {
      setNotice({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function toggleOpen(k) {
    const msg = k.is_open
      ? `إلغاء تفعيل «${k.name}»؟ ستختفي من قائمة المستخدمين ولن يستطيعوا الحجز فيها، وتبقى بياناتها محفوظة.`
      : `تفعيل «${k.name}»؟ ستظهر للمستخدمين من جديد.`;
    if (!window.confirm(msg)) return;
    try {
      await admin.setOpen(k.id, !k.is_open);
      setNotice({ type: 'ok', text: k.is_open ? 'تم إلغاء تفعيل الختمة' : 'تم تفعيل الختمة' });
      await load();
    } catch (err) {
      setNotice({ type: 'err', text: err.message });
    }
  }

  async function saveRename(e) {
    e.preventDefault();
    try {
      await admin.renameKhatma(editing.id, editing.name);
      setEditing(null);
      setNotice({ type: 'ok', text: 'تم تعديل اسم الختمة' });
      await load();
    } catch (err) {
      setNotice({ type: 'err', text: err.message });
    }
  }

  async function remove(k) {
    if (k.is_open) {
      setNotice({ type: 'err', text: 'لا يمكن حذف ختمة مفعّلة، ألغِ تفعيلها أولاً' });
      return;
    }
    const ok = window.confirm(
      `حذف «${k.name}» نهائياً؟\n\nسيُحذف معها كل أجزائها وحجوزاتها وسجلها، ولا يمكن التراجع.`
    );
    if (!ok) return;
    try {
      await admin.deleteKhatma(k.id);
      setNotice({ type: 'ok', text: 'تم حذف الختمة' });
      await load();
    } catch (err) {
      setNotice({ type: 'err', text: err.message });
    }
  }

  if (detail) return <KhatmaDetail khatmaId={detail} onBack={() => { setDetail(null); load(); }} />;

  return (
    <div className="space-y-5">
      <form onSubmit={create} className="card space-y-4 sm:p-6">
        <div>
          <p className="eyebrow">إنشاء جديد</p>
          <h2 className="mt-1 text-xl font-extrabold">ختمة جديدة</h2>
          <p className="mt-1 text-sm text-stone-500">ستُنشأ الختمة مع 30 جزءاً، ويمكن تفعيلها بعد الإنشاء.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="input"
            placeholder="اسم الختمة، مثال: ختمة رمضان"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            required
          />
          <button className="btn btn-primary sm:shrink-0" disabled={busy}>
            {busy ? 'لحظة...' : 'إنشاء الختمة'}
          </button>
        </div>
      </form>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      {!items ? (
        <p className="py-6 text-center text-stone-500">جارٍ التحميل...</p>
      ) : items.length === 0 ? (
        <p className="card text-center text-stone-600">لا توجد ختمات بعد. أنشئ أول ختمة من الأعلى.</p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((k) => (
            <li key={k.id} className={`card space-y-4 transition hover:shadow-md ${k.is_open ? '' : 'bg-stone-50/70'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="eyebrow">الختمة رقم {k.number}</p>
                  {editing?.id === k.id ? (
                    <form onSubmit={saveRename} className="mt-1 flex flex-col gap-2 sm:flex-row">
                      <input
                        className="input py-2"
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        minLength={2}
                        autoFocus
                        required
                      />
                      <div className="flex gap-2">
                        <button className="btn btn-primary px-4 py-2">حفظ</button>
                        <button type="button" className="btn btn-ghost px-4 py-2" onClick={() => setEditing(null)}>
                          إلغاء
                        </button>
                      </div>
                    </form>
                  ) : (
                    <h3 className="mt-1 text-xl font-extrabold">{k.name}</h3>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-base font-bold ${
                    k.is_open ? 'bg-leaf-100 text-leaf-700' : 'bg-sand-200 text-stone-600'
                  }`}
                >
                  {k.is_open ? 'مفعّلة' : 'موقوفة'}
                </span>
              </div>
              <ProgressBar completed={k.completed} reserved={k.reserved} available={k.available} />
              <div className="grid grid-cols-3 gap-2">
                <div className="stat-card"><span className="block font-extrabold text-leaf-700">{k.available}</span><span className="text-xs text-stone-500">متاح</span></div>
                <div className="stat-card"><span className="block font-extrabold text-amber-700">{k.reserved}</span><span className="text-xs text-stone-500">محجوز</span></div>
                <div className="stat-card"><span className="block font-extrabold text-stone-700">{k.completed}</span><span className="text-xs text-stone-500">مكتمل</span></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary" onClick={() => setDetail(k.id)}>
                  مراقبة الأجزاء
                </button>
                <button className="btn btn-ghost" onClick={() => setEditing({ id: k.id, name: k.name })}>
                  تعديل الاسم
                </button>
                <button className="btn btn-ghost" onClick={() => toggleOpen(k)}>
                  {k.is_open ? 'إلغاء التفعيل' : 'تفعيل'}
                </button>
                <button className="btn btn-danger" onClick={() => remove(k)}>
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
