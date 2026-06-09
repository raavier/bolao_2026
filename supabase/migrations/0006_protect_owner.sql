-- ============================================================================
-- Bolão Copa 2026 — migração 0006
-- Protege o dono do bolão: ninguém (nem outro admin, nem via API) pode remover
-- o is_admin do email do dono. Reforço no banco, além da checagem na action.
-- Idempotente.
-- ============================================================================

create or replace function protect_owner_admin()
returns trigger
language plpgsql
as $$
begin
  if old.email = 'flavio.ravier@gmail.com'
     and old.is_admin = true
     and new.is_admin = false then
    raise exception 'O admin do dono do bolão não pode ser removido.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_owner_admin on participantes;
create trigger trg_protect_owner_admin
  before update on participantes
  for each row execute function protect_owner_admin();
