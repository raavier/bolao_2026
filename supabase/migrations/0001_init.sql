-- ============================================================================
-- Bolão da Copa 2026 — schema inicial (DEFINICOES.md §7)
-- Rodar no SQL editor do Supabase ou via `supabase db push`.
-- ============================================================================

create type fase as enum (
  'group', 'round_of_32', 'round_of_16',
  'quarter_finals', 'semi_finals', 'third_place', 'final'
);

create type jogo_status as enum ('agendado', 'encerrado');

-- Participantes (1:1 com auth.users) -----------------------------------------
create table participantes (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text not null,
  email      text not null unique,
  is_admin   boolean not null default false,
  criado_em  timestamptz not null default now()
);

-- Jogos (semeados a partir da tabela oficial da FIFA) ------------------------
create table jogos (
  id              int primary key,           -- nº oficial do jogo (1..104)
  fase            fase not null,
  grupo           text,                       -- A..L, só na fase de grupos
  inicio          timestamptz not null,       -- apito inicial; define o lock
  mandante        text not null,
  visitante       text not null,
  gols_mandante   int,                        -- null até encerrar
  gols_visitante  int,
  status          jogo_status not null default 'agendado'
);

-- Palpites de placar ---------------------------------------------------------
create table palpites (
  id               uuid primary key default gen_random_uuid(),
  participante_id  uuid not null references participantes (id) on delete cascade,
  jogo_id          int  not null references jogos (id) on delete cascade,
  gols_mandante    int  not null check (gols_mandante >= 0),
  gols_visitante   int  not null check (gols_visitante >= 0),
  atualizado_em    timestamptz not null default now(),
  unique (participante_id, jogo_id)
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table participantes   enable row level security;
alter table jogos           enable row level security;
alter table palpites        enable row level security;

create or replace function is_admin() returns boolean
language sql stable security definer as $$
  select coalesce(
    (select is_admin from participantes where id = auth.uid()),
    false
  );
$$;

-- participantes: cada um lê o próprio; admin lê todos.
create policy participantes_select_self on participantes
  for select using (id = auth.uid() or is_admin());

-- jogos: leitura liberada a qualquer autenticado; escrita só admin.
create policy jogos_select_all on jogos
  for select using (auth.role() = 'authenticated');
create policy jogos_write_admin on jogos
  for all using (is_admin()) with check (is_admin());

-- palpites: o dono lê/grava os seus; palpites alheios só após o jogo começar.
create policy palpites_select_self_or_started on palpites
  for select using (
    participante_id = auth.uid()
    or exists (
      select 1 from jogos j
      where j.id = palpites.jogo_id and j.inicio <= now()
    )
  );

create policy palpites_insert_self on palpites
  for insert with check (
    participante_id = auth.uid()
    and exists (
      select 1 from jogos j
      where j.id = palpites.jogo_id and j.inicio > now()
    )
  );

create policy palpites_update_self on palpites
  for update using (participante_id = auth.uid())
  with check (
    participante_id = auth.uid()
    and exists (
      select 1 from jogos j
      where j.id = palpites.jogo_id and j.inicio > now()
    )
  );
