-- CreatorFlow IAP subscriptions (Apple App Store)
-- Writes via service role only; users can read their own row.

create table public.iap_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  product_id text not null,
  original_transaction_id text not null,
  expires_at timestamptz,
  environment text not null default 'Production' check (environment in ('Sandbox', 'Production')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (original_transaction_id)
);

create index iap_subscriptions_user_id_idx on public.iap_subscriptions (user_id);

alter table public.iap_subscriptions enable row level security;

create policy "Users can read own IAP subscription"
  on public.iap_subscriptions
  for select
  using (auth.uid() = user_id);

-- Service role bypasses RLS for inserts/updates from the API.

create or replace function public.set_profile_plan(p_user_id uuid, p_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_plan not in ('free', 'pro') then
    raise exception 'invalid plan %', p_plan;
  end if;

  update public.profiles
  set plan = p_plan
  where id = p_user_id;

  if not found then
    insert into public.profiles (id, plan)
    values (p_user_id, p_plan);
  end if;
end;
$$;

revoke all on function public.set_profile_plan(uuid, text) from public;
grant execute on function public.set_profile_plan(uuid, text) to service_role;
