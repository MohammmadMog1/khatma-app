-- =====================================================
-- الإصدار 2: حذف/تعديل الختمات + تعديل بيانات الحساب
-- للمشروع المثبّت سابقاً: نفّذ هذا الملف فقط (آمن لإعادة التنفيذ).
-- للتثبيت الجديد: نفّذ 1 ثم 2 ثم 3 ثم هذا الملف.
-- =====================================================
set search_path = public, extensions;

-- ---------- الختمات ----------
create or replace function admin_rename_khatma(p_token uuid, p_khatma_id uuid, p_name text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  perform assert_admin(p_token);
  if p_name is null or length(trim(p_name)) < 2 then raise exception 'name_required'; end if;
  update khatmas set name = trim(p_name) where id = p_khatma_id;
  if not found then raise exception 'khatma_not_found'; end if;
  return jsonb_build_object('ok', true);
end $$;

-- الحذف نهائي (يحذف أجزاء الختمة وسجلها). لا يُسمح إلا للختمة الموقوفة.
create or replace function admin_delete_khatma(p_token uuid, p_khatma_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_open boolean;
begin
  perform assert_admin(p_token);
  select is_open into v_open from khatmas where id = p_khatma_id;
  if not found then raise exception 'khatma_not_found'; end if;
  if v_open then raise exception 'khatma_active'; end if;
  delete from khatmas where id = p_khatma_id;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- الحساب ----------
create or replace function get_profile(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare u users%rowtype;
begin
  select * into u from users where id = p_user_id;
  if not found then raise exception 'user_not_found'; end if;
  return jsonb_build_object('id', u.id, 'name', u.name, 'phone', u.phone, 'role', u.role);
end $$;

-- تعديل المستخدم لبياناته. إن كان أدمن فيلزم توكن جلسته.
create or replace function update_profile(p_user_id uuid, p_name text, p_phone text, p_token uuid default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare u users%rowtype;
begin
  select * into u from users where id = p_user_id;
  if not found then raise exception 'user_not_found'; end if;

  if u.role = 'admin' then
    if assert_admin(p_token) <> p_user_id then raise exception 'forbidden'; end if;
  end if;

  if p_name is null or length(trim(p_name)) < 2 then raise exception 'name_required'; end if;
  if p_phone is null or p_phone !~ '^[0-9]{10,15}$' then raise exception 'invalid_phone'; end if;
  if exists (select 1 from users where phone = p_phone and id <> p_user_id) then
    raise exception 'phone_taken';
  end if;

  update users set name = trim(p_name), phone = p_phone where id = p_user_id;
  return jsonb_build_object('id', u.id, 'name', trim(p_name), 'phone', p_phone, 'role', u.role);
end $$;

-- تعديل الأدمن لبيانات أي مستخدم
create or replace function admin_update_user(p_token uuid, p_user_id uuid, p_name text, p_phone text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  perform assert_admin(p_token);
  if p_name is null or length(trim(p_name)) < 2 then raise exception 'name_required'; end if;
  if p_phone is null or p_phone !~ '^[0-9]{10,15}$' then raise exception 'invalid_phone'; end if;
  if exists (select 1 from users where phone = p_phone and id <> p_user_id) then
    raise exception 'phone_taken';
  end if;
  update users set name = trim(p_name), phone = p_phone where id = p_user_id;
  if not found then raise exception 'user_not_found'; end if;
  return jsonb_build_object('ok', true);
end $$;
