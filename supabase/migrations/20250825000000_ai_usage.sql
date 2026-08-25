-- ai_usage: monthly quota per user (Supabase auth user id or demo:<uuid>)
create table if not exists public.ai_usage (
  user_id text not null,
  month text not null,
  count integer not null default 0 check (count >= 0),
  limit integer not null default 8 check (limit > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

alter table public.ai_usage enable row level security;

-- Service role bypasses RLS; users read only their row via JWT
create policy "Users read own ai_usage"
  on public.ai_usage
  for select
  using (auth.uid()::text = user_id or user_id like 'demo:%');

-- Atomic increment with limit check (called from API with service role)
create or replace function public.increment_ai_usage(
  p_user_id text,
  p_month text,
  p_limit integer default 8
)
returns table(count integer, limit integer, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_limit integer;
begin
  insert into public.ai_usage (user_id, month, count, limit)
  values (p_user_id, p_month, 0, p_limit)
  on conflict (user_id, month) do nothing;

  select ai_usage.count, ai_usage.limit
  into v_count, v_limit
  from public.ai_usage
  where user_id = p_user_id and month = p_month
  for update;

  if v_count >= v_limit then
    raise exception 'LIMIT_REACHED';
  end if;

  update public.ai_usage
  set count = ai_usage.count + 1, updated_at = now()
  where user_id = p_user_id and month = p_month
  returning ai_usage.count, ai_usage.limit into v_count, v_limit;

  return query
  select v_count, v_limit, greatest(0, v_limit - v_count);
end;
$$;

grant execute on function public.increment_ai_usage(text, text, integer) to service_role;
