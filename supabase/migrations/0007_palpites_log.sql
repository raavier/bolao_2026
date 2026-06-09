-- ============================================================================
-- Bolão Copa 2026 — migração 0007
-- Histórico append-only de palpites: cada vez que alguém salva um palpite
-- (insert OU update na tabela `palpites`), uma linha é gravada aqui.
-- Permite estatísticas futuras: quem trocou demais, quem palpitou de última
-- hora, reconstruir qualquer palpite no tempo. Capturado por trigger — assim
-- qualquer caminho que escreva em `palpites` é registrado, sem depender do app.
-- Idempotente.
-- ============================================================================

create table if not exists palpites_log (
  id               bigint generated always as identity primary key,
  participante_id  uuid not null references participantes (id) on delete cascade,
  jogo_id          int  not null references jogos (id) on delete cascade,
  gols_mandante    int  not null,
  gols_visitante   int  not null,
  criado_em        timestamptz not null default now()
);

create index if not exists palpites_log_participante_jogo
  on palpites_log (participante_id, jogo_id);

-- Função que registra a versão salva.
create or replace function log_palpite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into palpites_log (participante_id, jogo_id, gols_mandante, gols_visitante)
  values (new.participante_id, new.jogo_id, new.gols_mandante, new.gols_visitante);
  return new;
end;
$$;

drop trigger if exists trg_log_palpite on palpites;
create trigger trg_log_palpite
  after insert or update on palpites
  for each row execute function log_palpite();

-- RLS: leitura segue a lógica de `palpites` — o dono vê os seus; os de outros
-- só após o apito. Escrita é só via trigger (ninguém insere direto).
alter table palpites_log enable row level security;

drop policy if exists palpites_log_select on palpites_log;
create policy palpites_log_select on palpites_log
  for select using (
    participante_id = auth.uid()
    or exists (
      select 1 from jogos j
      where j.id = palpites_log.jogo_id and j.inicio <= now()
    )
  );
