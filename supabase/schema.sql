-- Bibs — schéma DB (état final, pour fresh install)
-- Si tu as déjà exécuté schema.sql v1, applique plutôt migrations/002_kinds_and_duration.sql.

create extension if not exists "pgcrypto";

create table if not exists public.bottles (
  id uuid primary key default gen_random_uuid(),
  drunk_at timestamptz not null,
  kind text not null default 'formula' check (kind in ('formula','breast','pumped')),
  amount_ml integer check (amount_ml between 0 and 210),
  duration_min integer check (duration_min is null or duration_min between 0 and 60),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bottles_drunk_at_idx
  on public.bottles (drunk_at desc);

create or replace function public.bottles_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bottles_set_updated_at on public.bottles;
create trigger bottles_set_updated_at
  before update on public.bottles
  for each row execute function public.bottles_set_updated_at();

-- RLS : URL publique côté client. Politiques permissives acceptées par le projet.
alter table public.bottles enable row level security;

drop policy if exists "bottles_anon_all" on public.bottles;
create policy "bottles_anon_all"
  on public.bottles
  for all
  to anon
  using (true)
  with check (true);
