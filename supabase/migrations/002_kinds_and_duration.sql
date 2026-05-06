-- Bibs — migration v2 : 3 types de feed (poudre / sein / tiré) + durée
-- À exécuter dans le SQL editor de Supabase une seule fois.
-- Idempotent : peut être relancé sans casse.

-- 1. Nouvelle colonne `kind`. Valeurs : formula | breast | pumped.
--    Les rows existantes deviennent 'formula' (default).
alter table public.bottles
  add column if not exists kind text not null default 'formula';

-- Contrainte de validation (séparée pour rester idempotent).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bottles_kind_check'
  ) then
    alter table public.bottles
      add constraint bottles_kind_check
      check (kind in ('formula','breast','pumped'));
  end if;
end $$;

-- 2. Nouvelle colonne `duration_min` (tétée au sein).
alter table public.bottles
  add column if not exists duration_min integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bottles_duration_min_check'
  ) then
    alter table public.bottles
      add constraint bottles_duration_min_check
      check (duration_min is null or duration_min between 0 and 60);
  end if;
end $$;

-- 3. amount_ml devient nullable (les tétées au sein n'ont pas de ml).
alter table public.bottles
  alter column amount_ml drop not null;
