-- =====================================================
-- الخطوة 2: الدوال (RPC) - كل منطق التطبيق هنا
-- يمكن إعادة تنفيذ الملف أكثر من مرة بأمان
-- =====================================================
set search_path = public, extensions;

alter table users add column if not exists pin_failed int not null default 0;
alter table users add column if not exists pin_locked_until timestamptz;

-- ---------- دوال مساعدة (غير متاحة للمتصفح) ----------
create or replace function assert_admin(p_token uuid) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare v_user uuid;
begin
  select s.user_id into v_user
  from admin_sessions s join users u on u.id = s.user_id
  where s.token = p_token and s.expires_at > now() and u.role = 'admin';
  if v_user is null then raise exception 'forbidden'; end if;
  return v_user;
end $$;

create or replace function assert_user(p_user_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_user_id is null or not exists (select 1 from users where id = p_user_id) then
    raise exception 'user_not_found';
  end if;
end $$;

create or replace function assert_open_khatma(p_khatma_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from khatmas where id = p_khatma_id and is_open) then
    raise exception 'khatma_closed';
  end if;
end $$;

revoke all on function assert_admin(uuid)        from public, anon, authenticated;
revoke all on function assert_user(uuid)         from public, anon, authenticated;
revoke all on function assert_open_khatma(uuid)  from public, anon, authenticated;

-- ---------- تسجيل الدخول ----------
create or replace function login_user(p_phone text, p_name text default null, p_pin text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  u users%rowtype;
  v_token uuid;
begin
  if p_phone is null or p_phone !~ '^[0-9]{10,15}$' then
    raise exception 'invalid_phone';
  end if;

  select * into u from users where phone = p_phone;

  -- رقم جديد
  if not found then
    if p_name is null or length(trim(p_name)) < 2 then
      return jsonb_build_object('status', 'needs_name');
    end if;
    insert into users (name, phone) values (trim(p_name), p_phone) returning * into u;
    return jsonb_build_object('status', 'ok',
      'user', jsonb_build_object('id', u.id, 'name', u.name, 'role', u.role));
  end if;

  -- أدمن: يحتاج PIN
  if u.role = 'admin' then
    if u.pin_locked_until is not null and u.pin_locked_until > now() then
      return jsonb_build_object('status', 'locked');
    end if;
    if p_pin is null or p_pin = '' then
      return jsonb_build_object('status', 'needs_pin');
    end if;
    if u.pin_hash is null or crypt(p_pin, u.pin_hash) <> u.pin_hash then
      update users set
        pin_failed = case when pin_failed + 1 >= 5 then 0 else pin_failed + 1 end,
        pin_locked_until = case when pin_failed + 1 >= 5 then now() + interval '15 minutes' else null end
      where id = u.id;
      return jsonb_build_object('status', 'wrong_pin');
    end if;
    update users set pin_failed = 0, pin_locked_until = null where id = u.id;
    delete from admin_sessions where expires_at < now();
    insert into admin_sessions (user_id) values (u.id) returning token into v_token;
    return jsonb_build_object('status', 'ok', 'token', v_token,
      'user', jsonb_build_object('id', u.id, 'name', u.name, 'role', u.role));
  end if;

  -- مستخدم عادي
  return jsonb_build_object('status', 'ok',
    'user', jsonb_build_object('id', u.id, 'name', u.name, 'role', u.role));
end $$;

-- ---------- قراءة (للمستخدمين) ----------
create or replace function list_open_khatmas(p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  return (
    select coalesce(jsonb_agg(to_jsonb(x) order by x.number), '[]'::jsonb) from (
      select k.id, k.number, k.name,
        count(*) filter (where p.status = 'available') as available,
        count(*) filter (where p.status = 'reserved')  as reserved,
        count(*) filter (where p.status = 'completed') as completed,
        count(*) filter (where p.user_id = p_user_id)  as mine
      from khatmas k join parts p on p.khatma_id = k.id
      where k.is_open
      group by k.id, k.number, k.name
    ) x
  );
end $$;

-- لا نُرجع هويات أصحاب الحجوزات الآخرين: فقط is_mine
create or replace function get_khatma_parts(p_khatma_id uuid, p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare k khatmas%rowtype;
begin
  select * into k from khatmas where id = p_khatma_id and is_open;
  if not found then raise exception 'khatma_closed'; end if;
  return jsonb_build_object(
    'khatma', jsonb_build_object('id', k.id, 'number', k.number, 'name', k.name),
    'parts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'number', p.number,
        'status', p.status,
        'is_mine', (p.user_id is not null and p.user_id = p_user_id)
      ) order by p.number), '[]'::jsonb)
      from parts p where p.khatma_id = k.id
    )
  );
end $$;

-- ---------- عمليات المستخدم ----------
create or replace function reserve_parts(p_user_id uuid, p_khatma_id uuid, p_numbers int[])
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare n int;
begin
  perform assert_user(p_user_id);
  perform assert_open_khatma(p_khatma_id);
  if p_numbers is null or cardinality(p_numbers) = 0 then
    raise exception 'nothing_selected';
  end if;
  foreach n in array p_numbers loop
    -- تحديث واحد بشرط: ينجح شخص واحد فقط عند التزامن
    update parts
       set status = 'reserved', user_id = p_user_id, reserved_at = now(), completed_at = null
     where khatma_id = p_khatma_id and number = n and status = 'available';
    if not found then raise exception 'part_taken'; end if;
    insert into part_logs (khatma_id, part_number, user_id, acted_by, action)
    values (p_khatma_id, n, p_user_id, p_user_id, 'reserved');
  end loop;
  return jsonb_build_object('ok', true);
end $$;

create or replace function cancel_part(p_user_id uuid, p_khatma_id uuid, p_number int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  perform assert_user(p_user_id);
  perform assert_open_khatma(p_khatma_id);
  update parts
     set status = 'available', user_id = null, reserved_at = null, completed_at = null
   where khatma_id = p_khatma_id and number = p_number
     and user_id = p_user_id and status = 'reserved';
  if not found then raise exception 'invalid_action'; end if;
  insert into part_logs (khatma_id, part_number, user_id, acted_by, action)
  values (p_khatma_id, p_number, p_user_id, p_user_id, 'cancelled');
  return jsonb_build_object('ok', true);
end $$;

create or replace function set_part_done(p_user_id uuid, p_khatma_id uuid, p_number int, p_done boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  perform assert_user(p_user_id);
  perform assert_open_khatma(p_khatma_id);
  if p_done then
    update parts set status = 'completed', completed_at = now()
     where khatma_id = p_khatma_id and number = p_number
       and user_id = p_user_id and status = 'reserved';
  else
    update parts set status = 'reserved', completed_at = null
     where khatma_id = p_khatma_id and number = p_number
       and user_id = p_user_id and status = 'completed';
  end if;
  if not found then raise exception 'invalid_action'; end if;
  insert into part_logs (khatma_id, part_number, user_id, acted_by, action)
  values (p_khatma_id, p_number, p_user_id, p_user_id,
          (case when p_done then 'completed' else 'uncompleted' end)::log_action);
  return jsonb_build_object('ok', true);
end $$;

-- ---------- عمليات الأدمن (كلها تتحقق من الجلسة) ----------
create or replace function admin_create_khatma(p_token uuid, p_name text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_admin uuid; v_id uuid;
begin
  v_admin := assert_admin(p_token);
  if p_name is null or length(trim(p_name)) < 2 then raise exception 'name_required'; end if;
  insert into khatmas (name, created_by) values (trim(p_name), v_admin) returning id into v_id;
  insert into parts (khatma_id, number) select v_id, g from generate_series(1, 30) g;
  return jsonb_build_object('id', v_id);
end $$;

create or replace function admin_list_khatmas(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  perform assert_admin(p_token);
  return (
    select coalesce(jsonb_agg(to_jsonb(x) order by x.number desc), '[]'::jsonb) from (
      select k.id, k.number, k.name, k.is_open, k.created_at, k.closed_at,
        count(*) filter (where p.status = 'available') as available,
        count(*) filter (where p.status = 'reserved')  as reserved,
        count(*) filter (where p.status = 'completed') as completed
      from khatmas k left join parts p on p.khatma_id = k.id
      group by k.id, k.number, k.name, k.is_open, k.created_at, k.closed_at
    ) x
  );
end $$;

create or replace function admin_get_khatma_parts(p_token uuid, p_khatma_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare k khatmas%rowtype;
begin
  perform assert_admin(p_token);
  select * into k from khatmas where id = p_khatma_id;
  if not found then raise exception 'khatma_not_found'; end if;
  return jsonb_build_object(
    'khatma', jsonb_build_object('id', k.id, 'number', k.number, 'name', k.name, 'is_open', k.is_open),
    'parts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'number', p.number, 'status', p.status,
        'user_name', u.name, 'user_phone', u.phone,
        'reserved_at', p.reserved_at, 'completed_at', p.completed_at
      ) order by p.number), '[]'::jsonb)
      from parts p left join users u on u.id = p.user_id
      where p.khatma_id = k.id
    )
  );
end $$;

create or replace function admin_revoke_part(p_token uuid, p_khatma_id uuid, p_number int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_admin uuid; v_holder uuid;
begin
  v_admin := assert_admin(p_token);
  select user_id into v_holder from parts
   where khatma_id = p_khatma_id and number = p_number and status <> 'available'
   for update;
  if v_holder is null then raise exception 'nothing_to_revoke'; end if;
  update parts
     set status = 'available', user_id = null, reserved_at = null, completed_at = null
   where khatma_id = p_khatma_id and number = p_number;
  insert into part_logs (khatma_id, part_number, user_id, acted_by, action)
  values (p_khatma_id, p_number, v_holder, v_admin, 'revoked_by_admin');
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_set_khatma_open(p_token uuid, p_khatma_id uuid, p_open boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  perform assert_admin(p_token);
  update khatmas
     set is_open = p_open, closed_at = case when p_open then null else now() end
   where id = p_khatma_id;
  if not found then raise exception 'khatma_not_found'; end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_list_users(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  perform assert_admin(p_token);
  return (
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb) from (
      select u.id, u.name, u.phone, u.role, u.created_at,
             (select count(*) from parts p where p.user_id = u.id) as parts_count
      from users u
    ) x
  );
end $$;

create or replace function admin_add_admin(p_token uuid, p_phone text, p_name text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  perform assert_admin(p_token);
  if p_phone is null or p_phone !~ '^[0-9]{10,15}$' then raise exception 'invalid_phone'; end if;
  if p_pin is null or p_pin !~ '^[0-9]{6}$' then raise exception 'invalid_pin'; end if;

  if exists (select 1 from users where phone = p_phone) then
    update users
       set role = 'admin', pin_hash = crypt(p_pin, gen_salt('bf')), pin_failed = 0, pin_locked_until = null
     where phone = p_phone;
  else
    if p_name is null or length(trim(p_name)) < 2 then raise exception 'name_required'; end if;
    insert into users (name, phone, role, pin_hash)
    values (trim(p_name), p_phone, 'admin', crypt(p_pin, gen_salt('bf')));
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_remove_admin(p_token uuid, p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_admin uuid;
begin
  v_admin := assert_admin(p_token);
  if v_admin = p_user_id then raise exception 'cannot_remove_self'; end if;
  update users set role = 'user', pin_hash = null where id = p_user_id and role = 'admin';
  delete from admin_sessions where user_id = p_user_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_get_logs(p_token uuid, p_khatma_id uuid default null, p_limit int default 100)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  perform assert_admin(p_token);
  return (
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb) from (
      select l.id, l.created_at, l.action, l.part_number,
             k.number as khatma_number, k.name as khatma_name,
             u.name as user_name, a.name as acted_by_name,
             (l.user_id <> l.acted_by) as by_other
      from part_logs l
      join khatmas k on k.id = l.khatma_id
      join users u on u.id = l.user_id
      join users a on a.id = l.acted_by
      where p_khatma_id is null or l.khatma_id = p_khatma_id
      order by l.created_at desc
      limit least(greatest(p_limit, 1), 500)
    ) x
  );
end $$;

create or replace function admin_logout(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from admin_sessions where token = p_token;
  return jsonb_build_object('ok', true);
end $$;
