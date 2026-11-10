import { useState } from 'react';
import Notice from './Notice';

const STORAGE_KEY = 'khatma_tasbeeh_v1';
const ADHKAR = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'أستغفر الله', 'اللهم صلّ على محمد'];

function readCounter() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      count: Number.isSafeInteger(saved.count) && saved.count >= 0 ? saved.count : 0,
      dhikr: ADHKAR.includes(saved.dhikr) ? saved.dhikr : ADHKAR[0],
      storageError: '',
    };
  } catch (error) {
    console.error('تعذر قراءة بيانات المسبحة من التخزين المحلي', error);
    return { count: 0, dhikr: ADHKAR[0], storageError: 'تعذر قراءة بيانات المسبحة المحفوظة.' };
  }
}

export default function TasbeehCounter({ onBack }) {
  const [state, setState] = useState(readCounter);

  function save(next) {
    const updated = { ...next, storageError: '' };
    setState(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: updated.count, dhikr: updated.dhikr }));
    } catch (error) {
      console.error('تعذر حفظ بيانات المسبحة في التخزين المحلي', error);
      setState({ ...updated, storageError: 'تعذر الحفظ على هذا الجهاز. تحقق من إعدادات التخزين في المتصفح.' });
    }
  }

  return (
    <section className="mx-auto w-full max-w-lg space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">ذكرٌ وطمأنينة</p>
          <h1 className="text-3xl font-extrabold text-leaf-800">المسبحة الإلكترونية</h1>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onBack}>رجوع</button>
      </div>

      <div className="card space-y-6 p-6 text-center sm:p-8">
        <label className="form-label text-start">
          <span>اختر الذكر</span>
          <select
            className="input"
            value={state.dhikr}
            onChange={(event) => save({ ...state, dhikr: event.target.value })}
          >
            {ADHKAR.map((dhikr) => <option key={dhikr} value={dhikr}>{dhikr}</option>)}
          </select>
        </label>

        <div aria-live="polite" aria-atomic="true">
          <p className="text-xl font-bold text-stone-600">{state.dhikr}</p>
          <p className="my-3 text-7xl font-extrabold tabular-nums text-leaf-800">{state.count}</p>
          <p className="text-sm text-stone-500">العدد محفوظ على هذا الجهاز فقط</p>
        </div>

        <button
          type="button"
          className="mx-auto grid h-36 w-36 place-items-center rounded-full border-8 border-leaf-100 bg-leaf-700 text-2xl font-extrabold text-white shadow-lg transition hover:bg-leaf-600 active:scale-95"
          aria-label={`زيادة عداد ${state.dhikr}`}
          disabled={state.count >= Number.MAX_SAFE_INTEGER}
          onClick={() => save({ ...state, count: state.count + 1 })}
        >
          سبّح
        </button>
        <button
          type="button"
          className="btn btn-ghost w-full"
          onClick={() => {
            if (state.count > 0 && window.confirm('هل تريد تصفير عداد الذكر؟')) {
              save({ ...state, count: 0 });
            }
          }}
        >
          تصفير العداد
        </button>
        {state.storageError && <Notice notice={{ type: 'err', text: state.storageError }} />}
      </div>
    </section>
  );
}
