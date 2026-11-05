import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../lib/api';
import { ACTION_LABEL, formatDate } from '../../lib/constants';
import Notice from '../../components/Notice';

export default function AdminLogs() {
  const { token } = useAuth();
  const admin = useMemo(() => adminApi(token), [token]);
  const [khatmas, setKhatmas] = useState([]);
  const [khatmaId, setKhatmaId] = useState('');
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');
  const [khatmasError, setKhatmasError] = useState('');

  useEffect(() => {
    admin.listKhatmas().then(setKhatmas).catch((e) => setKhatmasError(e.message));
  }, [admin]);

  useEffect(() => {
    let alive = true;
    setLogs(null);
    admin
      .logs(khatmaId)
      .then((d) => alive && setLogs(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [admin, khatmaId]);

  return (
    <div className="space-y-4">
      <div className="card">
        <label className="form-label">
          <span>تصفية حسب الختمة</span>
          <select className="input" value={khatmaId} onChange={(e) => setKhatmaId(e.target.value)}>
          <option value="">كل الختمات</option>
          {khatmas.map((k) => (
            <option key={k.id} value={k.id}>
              الختمة {k.number} — {k.name}
            </option>
          ))}
          </select>
        </label>
      </div>

      <Notice notice={khatmasError ? { type: 'err', text: khatmasError } : null} />
      <Notice notice={error ? { type: 'err', text: error } : null} />

      {!logs ? (
        <p className="py-6 text-center text-stone-500">جارٍ التحميل...</p>
      ) : logs.length === 0 ? (
        <p className="card text-center text-stone-600">لا توجد حركات بعد.</p>
      ) : (
        <ul className="space-y-3">
          {logs.map((l) => (
            <li key={l.id} className="card flex gap-3 p-4 sm:p-5">
              <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-leaf-50 font-extrabold text-leaf-700" aria-hidden="true">
                {l.part_number}
              </span>
              <div className="min-w-0">
                <p className="font-extrabold">
                  {l.user_name} <span className="font-medium text-stone-600">— {ACTION_LABEL[l.action]}</span>
                </p>
                <p className="mt-1 text-sm text-stone-600">الجزء {l.part_number} · الختمة {l.khatma_number} ({l.khatma_name})</p>
                <p className="mt-2 text-xs text-stone-500">
                  {formatDate(l.created_at)}
                  {l.by_other && ` · بواسطة ${l.acted_by_name}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
