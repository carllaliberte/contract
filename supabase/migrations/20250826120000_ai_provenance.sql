-- Extend ai_generations for provenance metadata
alter table public.ai_generations
  add column if not exists format text check (format in ('short', 'long')),
  add column if not exists mode text check (mode in ('generate', 'improve')),
  add column if not exists language text check (language in ('fr', 'en')),
  add column if not exists plan text check (plan in ('free', 'pro')),
  add column if not exists model text,
  add column if not exists title_hash text;
