-- ============================================================
-- SETUP COMPLETO — cole tudo no SQL Editor do Supabase e RUN.
-- Parte 1: schema + RLS | Parte 2: 104 jogos.
-- ============================================================

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


-- Gerado por scripts/generate-seed.mjs — NÃO editar à mão.
-- 104 jogos da Copa 2026. inicio em UTC; o app exibe em horário de Brasília.
-- Idempotente: re-executar atualiza horários/confrontos sem duplicar.

insert into jogos (id, fase, grupo, inicio, mandante, visitante, status) values
  (1, 'group', 'A', '2026-06-11T19:00:00.000Z', 'México', 'África do Sul', 'agendado'),
  (2, 'group', 'A', '2026-06-12T02:00:00.000Z', 'Coreia do Sul', 'Chéquia', 'agendado'),
  (3, 'group', 'B', '2026-06-12T19:00:00.000Z', 'Canadá', 'Bósnia e Herzegovina', 'agendado'),
  (4, 'group', 'D', '2026-06-13T01:00:00.000Z', 'Estados Unidos', 'Paraguai', 'agendado'),
  (5, 'group', 'C', '2026-06-14T01:00:00.000Z', 'Haiti', 'Escócia', 'agendado'),
  (6, 'group', 'D', '2026-06-14T04:00:00.000Z', 'Austrália', 'Turquia', 'agendado'),
  (7, 'group', 'C', '2026-06-13T22:00:00.000Z', 'Brasil', 'Marrocos', 'agendado'),
  (8, 'group', 'B', '2026-06-13T19:00:00.000Z', 'Catar', 'Suíça', 'agendado'),
  (9, 'group', 'E', '2026-06-14T23:00:00.000Z', 'Costa do Marfim', 'Equador', 'agendado'),
  (10, 'group', 'E', '2026-06-14T17:00:00.000Z', 'Alemanha', 'Curaçao', 'agendado'),
  (11, 'group', 'F', '2026-06-14T20:00:00.000Z', 'Países Baixos', 'Japão', 'agendado'),
  (12, 'group', 'F', '2026-06-15T02:00:00.000Z', 'Suécia', 'Tunísia', 'agendado'),
  (13, 'group', 'H', '2026-06-15T22:00:00.000Z', 'Arábia Saudita', 'Uruguai', 'agendado'),
  (14, 'group', 'H', '2026-06-15T16:00:00.000Z', 'Espanha', 'Cabo Verde', 'agendado'),
  (15, 'group', 'G', '2026-06-16T01:00:00.000Z', 'Irã', 'Nova Zelândia', 'agendado'),
  (16, 'group', 'G', '2026-06-15T19:00:00.000Z', 'Bélgica', 'Egito', 'agendado'),
  (17, 'group', 'I', '2026-06-16T19:00:00.000Z', 'França', 'Senegal', 'agendado'),
  (18, 'group', 'I', '2026-06-16T22:00:00.000Z', 'Iraque', 'Noruega', 'agendado'),
  (19, 'group', 'J', '2026-06-17T01:00:00.000Z', 'Argentina', 'Argélia', 'agendado'),
  (20, 'group', 'J', '2026-06-17T04:00:00.000Z', 'Áustria', 'Jordânia', 'agendado'),
  (21, 'group', 'L', '2026-06-17T23:00:00.000Z', 'Gana', 'Panamá', 'agendado'),
  (22, 'group', 'L', '2026-06-17T20:00:00.000Z', 'Inglaterra', 'Croácia', 'agendado'),
  (23, 'group', 'K', '2026-06-17T17:00:00.000Z', 'Portugal', 'RD Congo', 'agendado'),
  (24, 'group', 'K', '2026-06-18T02:00:00.000Z', 'Uzbequistão', 'Colômbia', 'agendado'),
  (25, 'group', 'A', '2026-06-18T16:00:00.000Z', 'Chéquia', 'África do Sul', 'agendado'),
  (26, 'group', 'B', '2026-06-18T19:00:00.000Z', 'Suíça', 'Bósnia e Herzegovina', 'agendado'),
  (27, 'group', 'B', '2026-06-18T22:00:00.000Z', 'Canadá', 'Catar', 'agendado'),
  (28, 'group', 'A', '2026-06-19T01:00:00.000Z', 'México', 'Coreia do Sul', 'agendado'),
  (29, 'group', 'C', '2026-06-20T01:00:00.000Z', 'Brasil', 'Haiti', 'agendado'),
  (30, 'group', 'C', '2026-06-19T22:00:00.000Z', 'Escócia', 'Marrocos', 'agendado'),
  (31, 'group', 'D', '2026-06-20T03:00:00.000Z', 'Turquia', 'Paraguai', 'agendado'),
  (32, 'group', 'D', '2026-06-19T19:00:00.000Z', 'Estados Unidos', 'Austrália', 'agendado'),
  (33, 'group', 'E', '2026-06-20T20:00:00.000Z', 'Alemanha', 'Costa do Marfim', 'agendado'),
  (34, 'group', 'E', '2026-06-21T00:00:00.000Z', 'Equador', 'Curaçao', 'agendado'),
  (35, 'group', 'F', '2026-06-20T17:00:00.000Z', 'Países Baixos', 'Suécia', 'agendado'),
  (36, 'group', 'F', '2026-06-21T04:00:00.000Z', 'Tunísia', 'Japão', 'agendado'),
  (37, 'group', 'H', '2026-06-21T22:00:00.000Z', 'Uruguai', 'Cabo Verde', 'agendado'),
  (38, 'group', 'H', '2026-06-21T16:00:00.000Z', 'Espanha', 'Arábia Saudita', 'agendado'),
  (39, 'group', 'G', '2026-06-21T19:00:00.000Z', 'Bélgica', 'Irã', 'agendado'),
  (40, 'group', 'G', '2026-06-22T01:00:00.000Z', 'Nova Zelândia', 'Egito', 'agendado'),
  (41, 'group', 'I', '2026-06-23T00:00:00.000Z', 'Noruega', 'Senegal', 'agendado'),
  (42, 'group', 'I', '2026-06-22T21:00:00.000Z', 'França', 'Iraque', 'agendado'),
  (43, 'group', 'J', '2026-06-22T17:00:00.000Z', 'Argentina', 'Áustria', 'agendado'),
  (44, 'group', 'J', '2026-06-23T03:00:00.000Z', 'Jordânia', 'Argélia', 'agendado'),
  (45, 'group', 'L', '2026-06-23T20:00:00.000Z', 'Inglaterra', 'Gana', 'agendado'),
  (46, 'group', 'L', '2026-06-23T23:00:00.000Z', 'Panamá', 'Croácia', 'agendado'),
  (47, 'group', 'K', '2026-06-23T17:00:00.000Z', 'Portugal', 'Uzbequistão', 'agendado'),
  (48, 'group', 'K', '2026-06-24T02:00:00.000Z', 'Colômbia', 'RD Congo', 'agendado'),
  (49, 'group', 'C', '2026-06-24T22:00:00.000Z', 'Escócia', 'Brasil', 'agendado'),
  (50, 'group', 'C', '2026-06-24T22:00:00.000Z', 'Marrocos', 'Haiti', 'agendado'),
  (51, 'group', 'B', '2026-06-24T19:00:00.000Z', 'Suíça', 'Canadá', 'agendado'),
  (52, 'group', 'B', '2026-06-24T19:00:00.000Z', 'Bósnia e Herzegovina', 'Catar', 'agendado'),
  (53, 'group', 'A', '2026-06-25T01:00:00.000Z', 'Chéquia', 'México', 'agendado'),
  (54, 'group', 'A', '2026-06-25T01:00:00.000Z', 'África do Sul', 'Coreia do Sul', 'agendado'),
  (55, 'group', 'E', '2026-06-25T20:00:00.000Z', 'Curaçao', 'Costa do Marfim', 'agendado'),
  (56, 'group', 'E', '2026-06-25T20:00:00.000Z', 'Equador', 'Alemanha', 'agendado'),
  (57, 'group', 'F', '2026-06-25T23:00:00.000Z', 'Japão', 'Suécia', 'agendado'),
  (58, 'group', 'F', '2026-06-25T23:00:00.000Z', 'Tunísia', 'Países Baixos', 'agendado'),
  (59, 'group', 'D', '2026-06-26T02:00:00.000Z', 'Turquia', 'Estados Unidos', 'agendado'),
  (60, 'group', 'D', '2026-06-26T02:00:00.000Z', 'Paraguai', 'Austrália', 'agendado'),
  (61, 'group', 'I', '2026-06-26T19:00:00.000Z', 'Noruega', 'França', 'agendado'),
  (62, 'group', 'I', '2026-06-26T19:00:00.000Z', 'Senegal', 'Iraque', 'agendado'),
  (63, 'group', 'G', '2026-06-27T03:00:00.000Z', 'Egito', 'Irã', 'agendado'),
  (64, 'group', 'G', '2026-06-27T03:00:00.000Z', 'Nova Zelândia', 'Bélgica', 'agendado'),
  (65, 'group', 'H', '2026-06-27T00:00:00.000Z', 'Cabo Verde', 'Arábia Saudita', 'agendado'),
  (66, 'group', 'H', '2026-06-27T00:00:00.000Z', 'Uruguai', 'Espanha', 'agendado'),
  (67, 'group', 'L', '2026-06-27T21:00:00.000Z', 'Panamá', 'Inglaterra', 'agendado'),
  (68, 'group', 'L', '2026-06-27T21:00:00.000Z', 'Croácia', 'Gana', 'agendado'),
  (69, 'group', 'J', '2026-06-28T02:00:00.000Z', 'Argélia', 'Áustria', 'agendado'),
  (70, 'group', 'J', '2026-06-28T02:00:00.000Z', 'Jordânia', 'Argentina', 'agendado'),
  (71, 'group', 'K', '2026-06-27T23:30:00.000Z', 'Colômbia', 'Portugal', 'agendado'),
  (72, 'group', 'K', '2026-06-27T23:30:00.000Z', 'RD Congo', 'Uzbequistão', 'agendado'),
  (73, 'round_of_32', null, '2026-06-28T19:00:00.000Z', '2º Grupo A', '2º Grupo B', 'agendado'),
  (74, 'round_of_32', null, '2026-06-29T20:30:00.000Z', '1º Grupo E', '3º A/B/C/D/F', 'agendado'),
  (75, 'round_of_32', null, '2026-06-30T01:00:00.000Z', '1º Grupo F', '2º Grupo C', 'agendado'),
  (76, 'round_of_32', null, '2026-06-29T17:00:00.000Z', '1º Grupo C', '2º Grupo F', 'agendado'),
  (77, 'round_of_32', null, '2026-06-30T21:00:00.000Z', '1º Grupo I', '3º C/D/F/G/H', 'agendado'),
  (78, 'round_of_32', null, '2026-06-30T17:00:00.000Z', '2º Grupo E', '2º Grupo I', 'agendado'),
  (79, 'round_of_32', null, '2026-07-01T01:00:00.000Z', '1º Grupo A', '3º C/E/F/H/I', 'agendado'),
  (80, 'round_of_32', null, '2026-07-01T16:00:00.000Z', '1º Grupo L', '3º E/H/I/J/K', 'agendado'),
  (81, 'round_of_32', null, '2026-07-02T00:00:00.000Z', '1º Grupo D', '3º B/E/F/I/J', 'agendado'),
  (82, 'round_of_32', null, '2026-07-01T20:00:00.000Z', '1º Grupo G', '3º A/E/H/I/J', 'agendado'),
  (83, 'round_of_32', null, '2026-07-02T23:00:00.000Z', '2º Grupo K', '2º Grupo L', 'agendado'),
  (84, 'round_of_32', null, '2026-07-02T19:00:00.000Z', '1º Grupo H', '2º Grupo J', 'agendado'),
  (85, 'round_of_32', null, '2026-07-03T03:00:00.000Z', '1º Grupo B', '3º E/F/G/I/J', 'agendado'),
  (86, 'round_of_32', null, '2026-07-03T22:00:00.000Z', '1º Grupo J', '2º Grupo H', 'agendado'),
  (87, 'round_of_32', null, '2026-07-04T01:30:00.000Z', '1º Grupo K', '3º D/E/I/J/L', 'agendado'),
  (88, 'round_of_32', null, '2026-07-03T18:00:00.000Z', '2º Grupo D', '2º Grupo G', 'agendado'),
  (89, 'round_of_16', null, '2026-07-04T21:00:00.000Z', 'Vencedor J74', 'Vencedor J77', 'agendado'),
  (90, 'round_of_16', null, '2026-07-04T17:00:00.000Z', 'Vencedor J73', 'Vencedor J75', 'agendado'),
  (91, 'round_of_16', null, '2026-07-05T20:00:00.000Z', 'Vencedor J76', 'Vencedor J78', 'agendado'),
  (92, 'round_of_16', null, '2026-07-06T00:00:00.000Z', 'Vencedor J79', 'Vencedor J80', 'agendado'),
  (93, 'round_of_16', null, '2026-07-06T19:00:00.000Z', 'Vencedor J83', 'Vencedor J84', 'agendado'),
  (94, 'round_of_16', null, '2026-07-07T00:00:00.000Z', 'Vencedor J81', 'Vencedor J82', 'agendado'),
  (95, 'round_of_16', null, '2026-07-07T16:00:00.000Z', 'Vencedor J86', 'Vencedor J88', 'agendado'),
  (96, 'round_of_16', null, '2026-07-07T20:00:00.000Z', 'Vencedor J85', 'Vencedor J87', 'agendado'),
  (97, 'quarter_finals', null, '2026-07-09T20:00:00.000Z', 'Vencedor J89', 'Vencedor J90', 'agendado'),
  (98, 'quarter_finals', null, '2026-07-10T19:00:00.000Z', 'Vencedor J93', 'Vencedor J94', 'agendado'),
  (99, 'quarter_finals', null, '2026-07-11T21:00:00.000Z', 'Vencedor J91', 'Vencedor J92', 'agendado'),
  (100, 'quarter_finals', null, '2026-07-12T01:00:00.000Z', 'Vencedor J95', 'Vencedor J96', 'agendado'),
  (101, 'semi_finals', null, '2026-07-14T19:00:00.000Z', 'Vencedor J97', 'Vencedor J98', 'agendado'),
  (102, 'semi_finals', null, '2026-07-15T19:00:00.000Z', 'Vencedor J99', 'Vencedor J100', 'agendado'),
  (103, 'third_place', null, '2026-07-18T21:00:00.000Z', 'Perdedor J101', 'Perdedor J102', 'agendado'),
  (104, 'final', null, '2026-07-19T19:00:00.000Z', 'Vencedor J101', 'Vencedor J102', 'agendado')
on conflict (id) do update set
  fase = excluded.fase,
  grupo = excluded.grupo,
  inicio = excluded.inicio,
  mandante = excluded.mandante,
  visitante = excluded.visitante;
