-- Demo quota for x-demo-id (Edge Function / GitHub Pages demo mode)
create table if not exists public.demo_ai_usage (
  demo_id text not null,
  month text not null,
  count int not null default 0 check (count >= 0),
  primary key (demo_id, month)
);

alter table public.demo_ai_usage enable row level security;

create or replace function public.increment_demo_ai_usage(
  p_demo_id text,
  p_month text
)
returns table("count" integer, "limit" integer, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_limit integer := 8;
begin
  insert into public.demo_ai_usage (demo_id, month, count)
  values (p_demo_id, p_month, 0)
  on conflict (demo_id, month) do nothing;

  select demo_ai_usage.count
  into v_count
  from public.demo_ai_usage
  where demo_id = p_demo_id and month = p_month
  for update;

  if v_count >= v_limit then
    raise exception 'LIMIT_REACHED';
  end if;

  update public.demo_ai_usage
  set count = demo_ai_usage.count + 1
  where demo_id = p_demo_id and month = p_month
  returning demo_ai_usage.count into v_count;

  return query
  select v_count, v_limit, greatest(0, v_limit - v_count);
end;
$$;

grant execute on function public.increment_demo_ai_usage(text, text) to service_role;
