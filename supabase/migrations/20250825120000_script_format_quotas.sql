-- Separate short/long monthly quotas per plan

alter table public.ai_usage
  add column if not exists short_count int not null default 0 check (short_count >= 0),
  add column if not exists long_count int not null default 0 check (long_count >= 0);

update public.ai_usage
set short_count = count
where short_count = 0 and count > 0;

alter table public.demo_ai_usage
  add column if not exists short_count int not null default 0 check (short_count >= 0),
  add column if not exists long_count int not null default 0 check (long_count >= 0);

update public.demo_ai_usage
set short_count = count
where short_count = 0 and count > 0;

create or replace function public.get_format_limit(p_plan text, p_format text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case
    when p_format = 'long' then
      case when p_plan = 'pro' then 50 else 2 end
    else
      case when p_plan = 'pro' then 100 else 8 end
  end;
$$;

create or replace function public.get_ai_monthly_limit(p_plan text)
returns integer
language sql
immutable
set search_path = public
as $$
  select public.get_format_limit(p_plan, 'short');
$$;

create or replace function public.increment_ai_usage(
  p_user_id uuid,
  p_month text,
  p_format text default 'short'
)
returns table(
  short_count integer,
  long_count integer,
  short_limit integer,
  long_limit integer,
  short_remaining integer,
  long_remaining integer,
  plan text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_short integer;
  v_long integer;
  v_short_limit integer;
  v_long_limit integer;
  v_plan text;
  v_format text;
begin
  v_format := case when p_format = 'long' then 'long' else 'short' end;

  insert into public.profiles (id)
  values (p_user_id)
  on conflict (id) do nothing;

  select profiles.plan
  into v_plan
  from public.profiles
  where id = p_user_id;

  if v_plan is null then
    v_plan := 'free';
  end if;

  v_short_limit := public.get_format_limit(v_plan, 'short');
  v_long_limit := public.get_format_limit(v_plan, 'long');

  insert into public.ai_usage (user_id, month, count, short_count, long_count)
  values (p_user_id, p_month, 0, 0, 0)
  on conflict (user_id, month) do nothing;

  select ai_usage.short_count, ai_usage.long_count
  into v_short, v_long
  from public.ai_usage
  where user_id = p_user_id and month = p_month
  for update;

  if v_format = 'long' then
    if v_long >= v_long_limit then
      raise exception 'LIMIT_REACHED';
    end if;
    update public.ai_usage
    set
      long_count = ai_usage.long_count + 1,
      count = ai_usage.count + 1
    where user_id = p_user_id and month = p_month
    returning ai_usage.short_count, ai_usage.long_count into v_short, v_long;
  else
    if v_short >= v_short_limit then
      raise exception 'LIMIT_REACHED';
    end if;
    update public.ai_usage
    set
      short_count = ai_usage.short_count + 1,
      count = ai_usage.count + 1
    where user_id = p_user_id and month = p_month
    returning ai_usage.short_count, ai_usage.long_count into v_short, v_long;
  end if;

  return query
  select
    v_short,
    v_long,
    v_short_limit,
    v_long_limit,
    greatest(0, v_short_limit - v_short),
    greatest(0, v_long_limit - v_long),
    v_plan;
end;
$$;

create or replace function public.increment_demo_ai_usage(
  p_demo_id text,
  p_month text,
  p_format text default 'short'
)
returns table(
  short_count integer,
  long_count integer,
  short_limit integer,
  long_limit integer,
  short_remaining integer,
  long_remaining integer,
  plan text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_short integer;
  v_long integer;
  v_short_limit integer := public.get_format_limit('free', 'short');
  v_long_limit integer := public.get_format_limit('free', 'long');
  v_format text;
begin
  v_format := case when p_format = 'long' then 'long' else 'short' end;

  insert into public.demo_ai_usage (demo_id, month, count, short_count, long_count)
  values (p_demo_id, p_month, 0, 0, 0)
  on conflict (demo_id, month) do nothing;

  select demo_ai_usage.short_count, demo_ai_usage.long_count
  into v_short, v_long
  from public.demo_ai_usage
  where demo_id = p_demo_id and month = p_month
  for update;

  if v_format = 'long' then
    if v_long >= v_long_limit then
      raise exception 'LIMIT_REACHED';
    end if;
    update public.demo_ai_usage
    set
      long_count = demo_ai_usage.long_count + 1,
      count = demo_ai_usage.count + 1
    where demo_id = p_demo_id and month = p_month
    returning demo_ai_usage.short_count, demo_ai_usage.long_count into v_short, v_long;
  else
    if v_short >= v_short_limit then
      raise exception 'LIMIT_REACHED';
    end if;
    update public.demo_ai_usage
    set
      short_count = demo_ai_usage.short_count + 1,
      count = demo_ai_usage.count + 1
    where demo_id = p_demo_id and month = p_month
    returning demo_ai_usage.short_count, demo_ai_usage.long_count into v_short, v_long;
  end if;

  return query
  select
    v_short,
    v_long,
    v_short_limit,
    v_long_limit,
    greatest(0, v_short_limit - v_short),
    greatest(0, v_long_limit - v_long),
    'free'::text;
end;
$$;

grant execute on function public.get_format_limit(text, text) to service_role;
grant execute on function public.increment_ai_usage(uuid, text, text) to service_role;
grant execute on function public.increment_demo_ai_usage(text, text, text) to service_role;
