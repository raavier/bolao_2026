-- ============================================================================
-- Bolão Copa 2026 — migração 0008
-- Palpite de campeão: cada participante escolhe UMA seleção como campeã da Copa.
-- Vale 40 pontos (config/scoring.yaml) se acertar. Fecha no apito do 1º jogo —
-- diferente do lock per_game dos placares, é um prazo único e global.
-- O campeão real é definido pelo admin em `bolao_config`.
-- Idempotente.
-- ============================================================================

-- Prazo global do palpite de campeão = horário do primeiro apito da Copa.
-- stable (não muda dentro de uma transação) e security definer para que o RLS
-- consiga ler `jogos` sem depender das policies do chamador.
create or replace function primeiro_apito()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select min(inicio) from jogos;
$$;

-- Palpite de campeão (1 linha por participante) ------------------------------
create table if not exists palpite_campeao (
  participante_id  uuid primary key references participantes (id) on delete cascade,
  selecao          text not null,
  atualizado_em    timestamptz not null default now()
);

-- Configuração única do bolão (campeão real definido pelo admin) -------------
-- Linha única garantida pela PK booleana fixa em true.
create table if not exists bolao_config (
  id             boolean primary key default true check (id),
  campeao        text,
  atualizado_em  timestamptz not null default now()
);
insert into bolao_config (id) values (true) on conflict do nothing;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table palpite_campeao enable row level security;
alter table bolao_config    enable row level security;

-- palpite_campeao: o dono lê o seu sempre; os alheios só após o 1º apito
-- (espelha palpites_select_self_or_started da 0001).
drop policy if exists palpite_campeao_select on palpite_campeao;
create policy palpite_campeao_select on palpite_campeao
  for select using (
    participante_id = auth.uid()
    or now() >= primeiro_apito()
  );

-- insert/update: só o dono e enquanto o 1º jogo não começou.
drop policy if exists palpite_campeao_insert on palpite_campeao;
create policy palpite_campeao_insert on palpite_campeao
  for insert with check (
    participante_id = auth.uid()
    and now() < primeiro_apito()
  );

drop policy if exists palpite_campeao_update on palpite_campeao;
create policy palpite_campeao_update on palpite_campeao
  for update using (participante_id = auth.uid())
  with check (
    participante_id = auth.uid()
    and now() < primeiro_apito()
  );

-- bolao_config: leitura liberada a qualquer autenticado; escrita só admin
-- (reusa is_admin() da 0001).
drop policy if exists bolao_config_select on bolao_config;
create policy bolao_config_select on bolao_config
  for select using (auth.role() = 'authenticated');

drop policy if exists bolao_config_write on bolao_config;
create policy bolao_config_write on bolao_config
  for all using (is_admin()) with check (is_admin());
