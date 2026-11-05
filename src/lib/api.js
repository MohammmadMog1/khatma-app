import { supabase } from './supabase';

const MESSAGES = {
  invalid_phone: 'رقم الهاتف غير صحيح',
  user_not_found: 'الحساب غير موجود، سجّل الدخول من جديد',
  khatma_closed: 'هذه الختمة لم تعد متاحة',
  khatma_not_found: 'الختمة غير موجودة',
  nothing_selected: 'اختر جزءاً واحداً على الأقل',
  part_taken: 'سبقك أحد إلى هذا الجزء، حدّدنا لك القائمة من جديد',
  invalid_action: 'لا يمكن تنفيذ هذا الإجراء على هذا الجزء',
  forbidden: 'انتهت جلسة الأدمن، سجّل الدخول من جديد',
  name_required: 'اكتب الاسم (حرفان على الأقل)',
  invalid_pin: 'الرقم السري يجب أن يكون 6 أرقام',
  nothing_to_revoke: 'هذا الجزء غير محجوز',
  cannot_remove_self: 'لا يمكنك إزالة نفسك من الأدمن',
  phone_taken: 'هذا الرقم مسجّل لحساب آخر',
  khatma_active: 'لا يمكن حذف ختمة مفعّلة، ألغِ تفعيلها أولاً',
};

let onForbidden = () => {};
export function setForbiddenHandler(fn) {
  onForbidden = fn;
}

async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    const code = error.message;
    if (code === 'forbidden') onForbidden();
    const err = new Error(MESSAGES[code] || 'حدث خطأ غير متوقع، حاول مرة أخرى');
    err.code = code;
    if (!MESSAGES[code]) console.error(fn, error);
    throw err;
  }
  return data;
}

export const api = {
  getProfile: (userId) => rpc('get_profile', { p_user_id: userId }),
  updateProfile: (userId, name, phone, token) =>
    rpc('update_profile', { p_user_id: userId, p_name: name, p_phone: phone, p_token: token ?? null }),
  login: (phone, name, pin) =>
    rpc('login_user', { p_phone: phone, p_name: name ?? null, p_pin: pin ?? null }),
  listKhatmas: (userId) => rpc('list_open_khatmas', { p_user_id: userId }),
  getParts: (khatmaId, userId) =>
    rpc('get_khatma_parts', { p_khatma_id: khatmaId, p_user_id: userId }),
  reserve: (userId, khatmaId, numbers) =>
    rpc('reserve_parts', { p_user_id: userId, p_khatma_id: khatmaId, p_numbers: numbers }),
  cancel: (userId, khatmaId, number) =>
    rpc('cancel_part', { p_user_id: userId, p_khatma_id: khatmaId, p_number: number }),
  setDone: (userId, khatmaId, number, done) =>
    rpc('set_part_done', {
      p_user_id: userId,
      p_khatma_id: khatmaId,
      p_number: number,
      p_done: done,
    }),
};

export function adminApi(token) {
  return {
    createKhatma: (name) => rpc('admin_create_khatma', { p_token: token, p_name: name }),
    listKhatmas: () => rpc('admin_list_khatmas', { p_token: token }),
    getParts: (khatmaId) => rpc('admin_get_khatma_parts', { p_token: token, p_khatma_id: khatmaId }),
    revoke: (khatmaId, number) =>
      rpc('admin_revoke_part', { p_token: token, p_khatma_id: khatmaId, p_number: number }),
    setOpen: (khatmaId, open) =>
      rpc('admin_set_khatma_open', { p_token: token, p_khatma_id: khatmaId, p_open: open }),
    renameKhatma: (khatmaId, name) =>
      rpc('admin_rename_khatma', { p_token: token, p_khatma_id: khatmaId, p_name: name }),
    deleteKhatma: (khatmaId) => rpc('admin_delete_khatma', { p_token: token, p_khatma_id: khatmaId }),
    updateUser: (userId, name, phone) =>
      rpc('admin_update_user', { p_token: token, p_user_id: userId, p_name: name, p_phone: phone }),
    listUsers: () => rpc('admin_list_users', { p_token: token }),
    addAdmin: (phone, name, pin) =>
      rpc('admin_add_admin', { p_token: token, p_phone: phone, p_name: name || null, p_pin: pin }),
    removeAdmin: (userId) => rpc('admin_remove_admin', { p_token: token, p_user_id: userId }),
    logs: (khatmaId) =>
      rpc('admin_get_logs', { p_token: token, p_khatma_id: khatmaId || null, p_limit: 100 }),
    logout: () => rpc('admin_logout', { p_token: token }),
  };
}
