-- REC-004: vista JOIN unica per ridurre round-trip (timbrature + anagrafica)
-- Idempotente e ri-eseguibile in sicurezza.
create or replace view public.v_timbrature_utenti as
select
  t.id,
  t.pin,
  t.tipo,
  t.data,
  t.ore,
  t.giornologico,
  t.created_at,
  u.nome,
  u.cognome,
  u.ore_contrattuali
from public.timbrature t
join public.utenti u on u.pin = t.pin;

-- Facoltativo: indicizzazione utile se non già presente sulle tabelle
-- (le index vanno sempre sulle tabelle, non sulla view)
-- create index if not exists idx_timbrature_pin_data on public.timbrature (pin, data);
