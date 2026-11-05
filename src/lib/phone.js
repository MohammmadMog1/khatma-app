// يوحّد رقم الهاتف: أرقام عربية/فارسية -> إنجليزية، حذف الرموز، صيغة دولية (سوريا 963)
const COUNTRY_CODE = '963';

export function normalizePhone(input) {
  let p = String(input || '')
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/\D/g, '');

  if (p.startsWith('00')) p = p.slice(2);
  if (p.startsWith(COUNTRY_CODE)) return p;
  if (p.startsWith('0')) return COUNTRY_CODE + p.slice(1);
  if (p.length === 9) return COUNTRY_CODE + p; // 933123456
  return p;
}

export function isValidPhone(p) {
  return /^[0-9]{10,15}$/.test(p);
}

// للعرض فقط: 963933123456 -> 0933 123 456
export function formatPhone(p) {
  if (!p) return '';
  const local = p.startsWith(COUNTRY_CODE) ? '0' + p.slice(COUNTRY_CODE.length) : p;
  return local.replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');
}
