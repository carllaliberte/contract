-- AddIdeaDialog already stores instagram + x; the original ideas check rejected them.
alter table public.ideas drop constraint if exists ideas_platform_check;

alter table public.ideas
  add constraint ideas_platform_check
  check (platform in ('youtube', 'tiktok', 'reels', 'instagram', 'x'));
