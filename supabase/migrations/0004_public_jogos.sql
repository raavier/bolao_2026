-- ============================================================================
-- Bolão Copa 2026 — migração 0004
-- Calendário/resultados são públicos (dados da Copa). Libera leitura de `jogos`
-- para todos (inclusive sem login), para o ranking e a tela de jogos públicos.
-- Escrita continua restrita ao admin. Palpites seguem protegidos.
-- Idempotente.
-- ============================================================================

drop policy if exists jogos_select_all on jogos;

create policy jogos_select_all on jogos
  for select using (true);
