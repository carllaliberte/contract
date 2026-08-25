-- Profils liés à auth.users
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz default now()
);

-- Quota mensuel IA
create table public.ai_usage (
  user_id uuid references auth.users on delete cascade,
  month text not null, -- '2026-08'
  count int not null default 0 check (count >= 0),
  primary key (user_id, month)
);

-- Optionnel : log des générations
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  idea_id text,
  platform text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_generations enable row level security;

create policy "Users read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "own usage"
  on public.ai_usage
  for all
  using (auth.uid() = user_id);

create policy "Users read own ai_generations"
  on public.ai_generations
  for select
  using (auth.uid() = user_id);

-- Limites par plan (free = 8, pro = 200)
create or replace function public.get_ai_monthly_limit(p_plan text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case when p_plan = 'pro' then 200 else 8 end;
$$;

-- Incrément atomique avec lecture du plan
create or replace function public.increment_ai_usage(
  p_user_id uuid,
  p_month text
)
returns table(count integer, limit integer, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_limit integer;
  v_plan text;
begin
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

  v_limit := public.get_ai_monthly_limit(v_plan);

  insert into public.ai_usage (user_id, month, count)
  values (p_user_id, p_month, 0)
  on conflict (user_id, month) do nothing;

  select ai_usage.count
  into v_count
  from public.ai_usage
  where user_id = p_user_id and month = p_month
  for update;

  if v_count >= v_limit then
    raise exception 'LIMIT_REACHED';
  end if;

  update public.ai_usage
  set count = ai_usage.count + 1
  where user_id = p_user_id and month = p_month
  returning ai_usage.count into v_count;

  return query
  select v_count, v_limit, greatest(0, v_limit - v_count);
end;
$$;

grant execute on function public.get_ai_monthly_limit(text) to service_role;
grant execute on function public.increment_ai_usage(uuid, text) to service_role;

-- Création auto du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
