-- ============================================================================
-- Bolão Copa 2026 — migração 0005
-- Apelido (nickname) escolhido por cada participante para se identificar.
-- Leitura é pública (já coberta por participantes_select_all).
-- A escrita é feita por uma função que só altera o nickname do próprio usuário,
-- evitando que alguém mude is_admin/bloqueado da própria linha via API.
-- Idempotente.
-- ============================================================================

alter table participantes
  add column if not exists nickname text;

-- Define o apelido do usuário autenticado. Valida tamanho (2-20 chars).
create or replace function set_nickname(novo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  limpo text := btrim(novo);
begin
  if char_length(limpo) < 2 or char_length(limpo) > 20 then
    raise exception 'O apelido deve ter entre 2 e 20 caracteres.';
  end if;
  update participantes set nickname = limpo where id = auth.uid();
end;
$$;
