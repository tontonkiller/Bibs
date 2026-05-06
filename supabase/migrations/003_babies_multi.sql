-- Bibs — migration v3 : multi-bébés
-- À exécuter dans le SQL editor de Supabase une seule fois.
-- ⚠️ Cette migration WIPE la table bottles (choix produit assumé).

-- 1. Table babies.
create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birthdate date not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists babies_set_updated_at on public.babies;
create trigger babies_set_updated_at
  before update on public.babies
  for each row execute function public.bottles_set_updated_at();

alter table public.babies enable row level security;

drop policy if exists "babies_anon_all" on public.babies;
create policy "babies_anon_all"
  on public.babies
  for all
  to anon
  using (true)
  with check (true);

-- 2. Wipe bottles + ajout baby_id.
truncate table public.bottles;

alter table public.bottles
  add column if not exists baby_id uuid not null references public.babies(id) on delete cascade;

create index if not exists bottles_baby_drunk_at_idx
  on public.bottles (baby_id, drunk_at desc);

-- 3. RPC pour créer un bébé en hashant le mot de passe.
create or replace function public.create_baby(
  p_name text,
  p_birthdate date,
  p_password text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  if length(p_password) < 4 then
    raise exception 'Password too short';
  end if;
  insert into public.babies (name, birthdate, password_hash)
  values (p_name, p_birthdate, crypt(p_password, gen_salt('bf')))
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.create_baby(text, date, text) to anon;

-- 4. RPC pour vérifier le mot de passe et supprimer le bébé (cascade les biberons).
create or replace function public.delete_baby(
  p_baby_id uuid,
  p_password text
) returns boolean
language plpgsql
security definer
as $$
declare
  v_hash text;
begin
  select password_hash into v_hash from public.babies where id = p_baby_id;
  if v_hash is null then
    return false;
  end if;
  if v_hash = crypt(p_password, v_hash) then
    delete from public.babies where id = p_baby_id;
    return true;
  end if;
  return false;
end;
$$;

grant execute on function public.delete_baby(uuid, text) to anon;

-- 5. RPC pour changer le mot de passe (gratuit dans cette v2 — pas de mdp ancien requis).
create or replace function public.update_baby_password(
  p_baby_id uuid,
  p_new_password text
) returns boolean
language plpgsql
security definer
as $$
begin
  if length(p_new_password) < 4 then
    raise exception 'Password too short';
  end if;
  update public.babies
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = p_baby_id;
  return found;
end;
$$;

grant execute on function public.update_baby_password(uuid, text) to anon;
