export const STATUS_LABEL = {
  available: 'متاح',
  reserved: 'محجوز',
  completed: 'تمّ',
};

export const ACTION_LABEL = {
  reserved: 'حجز',
  cancelled: 'ألغى حجز',
  completed: 'أتمّ قراءة',
  uncompleted: 'تراجع عن إتمام',
  revoked_by_admin: 'سُحب حجزه من الأدمن',
};

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-u-nu-latn', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
