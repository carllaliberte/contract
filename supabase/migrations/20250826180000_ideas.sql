-- Creator ideas persisted per authenticated user
create table public.ideas (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  description text not null default '',
  status text not null check (status in ('idea', 'script', 'production', 'ready', 'published')),
  priority text not null check (priority in ('high', 'medium', 'low')),
  platform text not null check (platform in ('youtube', 'tiktok', 'reels')),
  script text,
  thumbnail text not null,
  video_url text,
  scheduled_at date,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index ideas_user_updated_idx on public.ideas (user_id, updated_at desc);

alter table public.ideas enable row level security;

create policy "Users read own ideas"
  on public.ideas
  for select
  using (auth.uid() = user_id);

create policy "Users insert own ideas"
  on public.ideas
  for insert
  with check (auth.uid() = user_id);

create policy "Users update own ideas"
  on public.ideas
  for update
  using (auth.uid() = user_id);

create policy "Users delete own ideas"
  on public.ideas
  for delete
  using (auth.uid() = user_id);
