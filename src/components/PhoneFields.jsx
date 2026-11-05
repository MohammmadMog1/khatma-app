import { isValidPhone, normalizePhone } from '../lib/phone';

export function phonesMatch(a, b) {
  const na = normalizePhone(a);
  return isValidPhone(na) && na === normalizePhone(b);
}

// حقل رقم الهاتف + حقل تأكيده (اكتبه مرة ثانية) مع رسالة تطابق فورية
export default function PhoneFields({
  phone,
  confirm,
  onPhone,
  onConfirm,
  needConfirm = true,
  disabled = false,
  autoFocus = false,
}) {
  const filled = confirm.trim().length > 0;
  const match = filled && normalizePhone(phone) === normalizePhone(confirm);

  return (
    <div className="space-y-4">
      <label className="block space-y-2">
        <span className="font-bold">رقم الهاتف</span>
        <input
          className="input text-center tracking-wider"
          dir="ltr"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="0933 123 456"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          disabled={disabled}
          autoFocus={autoFocus}
          required
        />
      </label>

      {needConfirm && (
        <label className="block space-y-2">
          <span className="font-bold">تأكيد رقم الهاتف</span>
          <span className="block text-base text-stone-600">اكتب الرقم مرة ثانية للتأكد من أنه صحيح</span>
          <input
            className="input text-center tracking-wider"
            dir="ltr"
            type="tel"
            inputMode="numeric"
            placeholder="0933 123 456"
            value={confirm}
            onChange={(e) => onConfirm(e.target.value)}
            disabled={disabled}
            required
          />
          {filled && (
            <span
              role="status"
              className={`block text-base font-bold ${match ? 'text-leaf-700' : 'text-red-700'}`}
            >
              {match ? '✓ الرقمان متطابقان' : 'الرقمان غير متطابقين'}
            </span>
          )}
        </label>
      )}
    </div>
  );
}
