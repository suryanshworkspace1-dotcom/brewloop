-- Streak updates for real check-ins only. Call after the loyalty_points row exists for (auth.uid(), cafe).
-- UTC calendar-day rules:
--   last_streak_visit_date IS NULL     -> streak_count = 1, last = today
--   last_streak_visit_date = today     -> no change
--   last_streak_visit_date = yesterday -> streak_count + 1, last = today
--   gap >= 2 calendar days             -> streak_count = 1, last = today

create or replace function public.apply_checkin_visit_streak(p_cafe_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (timezone('utc', now()))::date;
  v_last date;
  v_count integer;
  v_new_count integer;
  v_new_last date;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select lp.last_streak_visit_date, lp.streak_count
  into v_last, v_count
  from public.loyalty_points lp
  where lp.user_id = v_uid
    and lp.cafe_id = p_cafe_id
  for update;

  if not found then
    raise exception 'loyalty_points row not found for this cafe' using errcode = 'P0002';
  end if;

  if v_last is null then
    v_new_count := 1;
    v_new_last := v_today;
  elsif v_last = v_today then
    v_new_count := v_count;
    v_new_last := v_last;
  elsif v_last = v_today - 1 then
    v_new_count := v_count + 1;
    v_new_last := v_today;
  else
    v_new_count := 1;
    v_new_last := v_today;
  end if;

  update public.loyalty_points lp
  set
    streak_count = v_new_count,
    last_streak_visit_date = v_new_last
  where lp.user_id = v_uid
    and lp.cafe_id = p_cafe_id;

  return jsonb_build_object(
    'streak_count', v_new_count,
    'last_streak_visit_date', v_new_last
  );
end;
$$;

revoke all on function public.apply_checkin_visit_streak(uuid) from public;

grant execute on function public.apply_checkin_visit_streak(uuid) to authenticated;
