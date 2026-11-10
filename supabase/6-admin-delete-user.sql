-- حذف حساب مستخدم من لوحة الأدمن.
create or replace function admin_delete_user(p_token uuid, p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_admin uuid;
begin
  v_admin := assert_admin(p_token);
  if v_admin = p_user_id then raise exception 'cannot_delete_self'; end if;

  update parts
     set status = 'available', user_id = null, reserved_at = null, completed_at = null
   where user_id = p_user_id and status = 'reserved';

  delete from users where id = p_user_id;
  if not found then raise exception 'user_not_found'; end if;

  return jsonb_build_object('ok', true);
end $$;
