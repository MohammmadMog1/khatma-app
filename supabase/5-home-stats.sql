-- إحصاءات عامة للواجهة الرئيسية دون إرجاع بيانات الختمات أو المشاركين.
create or replace function get_public_khatma_stats()
returns jsonb language sql security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'ongoing', count(*) filter (
      where k.is_open and totals.completed < totals.total
    ),
    'completed', count(*) filter (
      where totals.total = 30 and totals.completed = 30
    )
  )
  from khatmas k
  cross join lateral (
    select
      count(*) as total,
      count(*) filter (where p.status = 'completed') as completed
    from parts p
    where p.khatma_id = k.id
  ) totals;
$$;
