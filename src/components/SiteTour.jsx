import { useState } from 'react';

const STEPS = [
  {
    title: 'أهلاً بك في نختُم معاً',
    text: 'مساحة تجمعنا على تلاوة القرآن الكريم والمشاركة في الختمات.',
    icon: '۞',
  },
  {
    title: 'تابع الختمات',
    text: 'تعرّف على الختمات الجارية والمنجزة، وشاهد تقدّم الأجزاء في كل ختمة.',
    icon: '📖',
  },
  {
    title: 'اختر جزءك',
    text: 'افتح ختمة جارية، واختر جزءاً متاحاً لتشارك في قراءته ومتابعة إتمامه.',
    icon: '✓',
  },
  {
    title: 'اذكر الله في كل وقت',
    text: 'استخدم المسبحة الإلكترونية واختر الذكر الذي تحبه. سيُحفظ عدّادك على جهازك دون اتصال بقاعدة البيانات.',
    icon: 'سبح',
  },
];

export default function SiteTour({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/60 p-4" dir="rtl">
      <section
        className="card w-full max-w-lg space-y-6 p-6 text-center shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        <div className="flex items-center justify-between text-sm font-bold text-stone-500">
          <span>رحلتك التعريفية</span>
          <span>{step + 1} / {STEPS.length}</span>
        </div>
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-leaf-50 text-3xl font-extrabold text-leaf-700" aria-hidden="true">
          {current.icon}
        </div>
        <div className="space-y-2">
          <h2 id="tour-title" className="text-2xl font-extrabold text-leaf-800">{current.title}</h2>
          <p className="text-lg leading-relaxed text-stone-600">{current.text}</p>
        </div>
        <div className="flex justify-center gap-2" aria-label="تقدم الرحلة">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={`h-2.5 w-2.5 rounded-full ${index === step ? 'bg-leaf-700' : 'bg-leaf-100'}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            تخطي
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (step === STEPS.length - 1 ? onClose() : setStep(step + 1))}
          >
            {step === STEPS.length - 1 ? 'إنهاء' : 'التالي'}
          </button>
        </div>
        {step > 0 && (
          <button type="button" className="text-sm font-bold text-stone-500 hover:text-leaf-700" onClick={() => setStep(step - 1)}>
            السابق
          </button>
        )}
      </section>
    </div>
  );
}
