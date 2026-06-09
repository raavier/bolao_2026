-- ============================================================================
-- Bolão Copa 2026 — migração 0002
-- 1) Cria participante automaticamente quando alguém faz login (Google/email).
-- 2) Permite ao admin bloquear/desbloquear participantes.
-- Idempotente: pode rodar mais de uma vez.
-- ============================================================================

-- 1) Coluna de bloqueio --------------------------------------------------------
alter table participantes
  add column if not exists bloqueado boolean not null default false;

-- 2) Auto-provisão no signup ---------------------------------------------------
-- Quando um novo auth.users é criado, insere o participante correspondente.
-- Nome: usa o full_name/name do provedor (Google), senão o trecho antes do @.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into participantes (id, nome, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 3) Helper: o participante atual está bloqueado? ------------------------------
create or replace function is_blocked()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select bloqueado from participantes where id = auth.uid()),
    false
  );
$$;

-- 4) Admin pode atualizar participantes (ex.: bloquear) ------------------------
drop policy if exists participantes_update_admin on participantes;
create policy participantes_update_admin on participantes
  for update using (is_admin()) with check (is_admin());

-- Admin enxerga todos já é coberto por participantes_select_self (or is_admin()).

-- 5) Bloqueado não palpita -----------------------------------------------------
-- Reforça no banco: além de dono + jogo aberto, exige não estar bloqueado.
drop policy if exists palpites_insert_self on palpites;
create policy palpites_insert_self on palpites
  for insert with check (
    participante_id = auth.uid()
    and not is_blocked()
    and exists (
      select 1 from jogos j
      where j.id = palpites.jogo_id and j.inicio > now()
    )
  );

drop policy if exists palpites_update_self on palpites;
create policy palpites_update_self on palpites
  for update using (participante_id = auth.uid())
  with check (
    participante_id = auth.uid()
    and not is_blocked()
    and exists (
      select 1 from jogos j
      where j.id = palpites.jogo_id and j.inicio > now()
    )
  );
