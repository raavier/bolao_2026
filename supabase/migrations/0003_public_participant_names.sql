-- ============================================================================
-- Bolão Copa 2026 — migração 0003
-- Permite que todos vejam os participantes (nome/pontuação são públicos no
-- bolão). Necessário para o ranking e para ver os palpites de cada um.
-- Idempotente.
-- ============================================================================

-- Substitui a policy restritiva (só o próprio/admin) por leitura aberta.
drop policy if exists participantes_select_self on participantes;
drop policy if exists participantes_select_all on participantes;

create policy participantes_select_all on participantes
  for select using (true);
