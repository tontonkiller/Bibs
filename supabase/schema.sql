-- Bibs — schéma DB (état final, pour fresh install)
-- Si tu as déjà exécuté schema.sql v1/v2, applique plutôt les migrations 002 puis 003.

create extension if not exists "pgcrypto";

create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birthdate date not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bottles (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  drunk_at timestamptz not null,
  kind text not null default 'formula' check (kind in ('formula','breast','pumped')),
  amount_ml integer check (amount_ml between 0 and 210),
  duration_min integer check (duration_min is null or duration_min between 0 and 60),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bottles_baby_drunk_at_idx
  on public.bottles (baby_id, drunk_at desc);

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

drop trigger if exists babies_set_updated_at on public.babies;
create trigger babies_set_updated_at
  before update on public.babies
  for each row execute function public.bottles_set_updated_at();

-- RLS permissives (sécurité « cosmétique » assumée).
alter table public.bottles enable row level security;
alter table public.babies enable row level security;

drop policy if exists "bottles_anon_all" on public.bottles;
create policy "bottles_anon_all"
  on public.bottles for all to anon using (true) with check (true);

drop policy if exists "babies_anon_all" on public.babies;
create policy "babies_anon_all"
  on public.babies for all to anon using (true) with check (true);

-- RPCs (création / delete avec mot de passe / changement de mot de passe).
create or replace function public.create_baby(p_name text, p_birthdate date, p_password text)
returns uuid language plpgsql security definer as $$
declare v_id uuid;
begin
  if length(p_password) < 4 then raise exception 'Password too short'; end if;
  insert into public.babies (name, birthdate, password_hash)
  values (p_name, p_birthdate, crypt(p_password, gen_salt('bf')))
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.delete_baby(p_baby_id uuid, p_password text)
returns boolean language plpgsql security definer as $$
declare v_hash text;
begin
  select password_hash into v_hash from public.babies where id = p_baby_id;
  if v_hash is null then return false; end if;
  if v_hash = crypt(p_password, v_hash) then
    delete from public.babies where id = p_baby_id;
    return true;
  end if;
  return false;
end; $$;

create or replace function public.update_baby_password(p_baby_id uuid, p_new_password text)
returns boolean language plpgsql security definer as $$
begin
  if length(p_new_password) < 4 then raise exception 'Password too short'; end if;
  update public.babies set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = p_baby_id;
  return found;
end; $$;

grant execute on function public.create_baby(text, date, text) to anon;
grant execute on function public.delete_baby(uuid, text) to anon;
grant execute on function public.update_baby_password(uuid, text) to anon;
