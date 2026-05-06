-- Bibs — migration v4 : mot de passe requis pour toute action sur un bébé
-- Idempotent : peut être relancé.

-- 1. Nouveau RPC pour vérifier le mot de passe (utilisé pour le « unlock »).
create or replace function public.verify_baby_password(
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
  return v_hash = crypt(p_password, v_hash);
end;
$$;

grant execute on function public.verify_baby_password(uuid, text) to anon;

-- 2. Nouveau RPC combiné : vérifie l'ancien mdp, met à jour name/birthdate
--    et optionnellement le mdp en une transaction.
create or replace function public.update_baby(
  p_baby_id uuid,
  p_current_password text,
  p_name text default null,
  p_birthdate date default null,
  p_new_password text default null
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
  if v_hash <> crypt(p_current_password, v_hash) then
    return false;
  end if;

  update public.babies
  set
    name = coalesce(p_name, name),
    birthdate = coalesce(p_birthdate, birthdate)
  where id = p_baby_id;

  if p_new_password is not null then
    if length(p_new_password) < 4 then
      raise exception 'Password too short';
    end if;
    update public.babies
    set password_hash = crypt(p_new_password, gen_salt('bf'))
    where id = p_baby_id;
  end if;

  return true;
end;
$$;

grant execute on function public.update_baby(uuid, text, text, date, text) to anon;

-- 3. Renforce update_baby_password en exigeant l'ancien mot de passe.
--    Drop l'ancienne signature (uuid, text) pour éviter ambiguïté.
drop function if exists public.update_baby_password(uuid, text);

create or replace function public.update_baby_password(
  p_baby_id uuid,
  p_old_password text,
  p_new_password text
) returns boolean
language plpgsql
security definer
as $$
declare
  v_hash text;
begin
  if length(p_new_password) < 4 then
    raise exception 'Password too short';
  end if;
  select password_hash into v_hash from public.babies where id = p_baby_id;
  if v_hash is null then return false; end if;
  if v_hash <> crypt(p_old_password, v_hash) then return false; end if;
  update public.babies
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = p_baby_id;
  return true;
end;
$$;

grant execute on function public.update_baby_password(uuid, text, text) to anon;
