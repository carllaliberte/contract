-- CreatorFlow content ideas (authenticated users)
create table public.ideas (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  description text not null default '',
  status text not null check (
    status in ('idea', 'script', 'production', 'ready', 'published')
  ),
  priority text not null check (priority in ('high', 'medium', 'low')),
  platform text not null check (platform in ('youtube', 'tiktok', 'reels')),
  updated_at timestamptz not null default now(),
  scheduled_at date,
  script text,
  thumbnail text not null default '',
  video_url text
);

create index ideas_user_updated_idx on public.ideas (user_id, updated_at desc);

alter table public.ideas enable row level security;

create policy "Users manage own ideas"
  on public.ideas
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
