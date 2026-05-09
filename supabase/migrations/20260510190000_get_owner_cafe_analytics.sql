-- Read-only aggregates for cafe owners. Enforces ownership inside the function (SECURITY DEFINER bypasses RLS).
create or replace function public.get_owner_cafe_analytics(p_cafe_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_unique bigint;
  v_checkins bigint;
  v_rate numeric;
  v_redemptions bigint;
  v_top jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select c.owner_id into v_owner
  from public.cafes c
  where c.id = p_cafe_id;

  if v_owner is null then
    raise exception 'cafe not found' using errcode = 'P0002';
  end if;

  if v_owner <> auth.uid() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select count(distinct v.user_id) into v_unique
  from public.visits v
  where v.cafe_id = p_cafe_id;

  select count(*) into v_checkins
  from public.visits v
  where v.cafe_id = p_cafe_id;

  with visit_counts as (
    select v.user_id, count(*)::bigint as n
    from public.visits v
    where v.cafe_id = p_cafe_id
    group by v.user_id
  ),
  stats as (
    select
      count(*) filter (where vc.n > 1)::numeric as repeaters,
      count(*)::numeric as customers
    from visit_counts vc
  )
  select case
    when stats.customers > 0 then stats.repeaters / stats.customers
    else null
  end into v_rate
  from stats;

  select count(*) into v_redemptions
  from public.redemptions r
  where r.cafe_id = p_cafe_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'user_id', s.user_id,
        'points', s.points,
        'streak_count', coalesce(s.streak_count, 0)
      )
      order by s.rn
    ),
    '[]'::jsonb
  )
  into v_top
  from (
    select
      lp.user_id,
      lp.points,
      lp.streak_count,
      row_number() over (order by lp.points desc, lp.user_id asc) as rn
    from public.loyalty_points lp
    where lp.cafe_id = p_cafe_id
    order by lp.points desc, lp.user_id asc
    limit 5
  ) s;

  return jsonb_build_object(
    'unique_customers', v_unique,
    'total_check_ins', v_checkins,
    'repeat_visit_rate', v_rate,
    'total_redemptions', v_redemptions,
    'top_customers', coalesce(v_top, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_owner_cafe_analytics(uuid) from public;

grant execute on function public.get_owner_cafe_analytics(uuid) to authenticated;
