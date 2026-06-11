-- ============================================================================
-- Bolão Copa 2026 — migração 0010
-- Estatística para admins: quem ainda NÃO escolheu o campeão da Copa.
--
-- O palpite de campeão tem prazo único e global (apito do 1º jogo), então é uma
-- estatística separada da de placares (palpites_em_branco, 0009). Mesmo motivo
-- para SECURITY DEFINER: a policy palpite_campeao_select (0008) impede o admin
-- de ver palpites alheios antes do 1º apito — justamente a janela que interessa.
-- A função revalida is_admin() e retorna SÓ nomes — nunca a seleção escolhida.
-- Idempotente.
-- ============================================================================

create or replace function campeao_em_branco()
returns table (
  participante_id uuid,
  nome text,
  nickname text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Apenas administradores.';
  end if;

  -- Depois do 1º apito o palpite de campeão trava — não há mais o que cobrar.
  if now() >= primeiro_apito() then
    return;
  end if;

  return query
  select p.id, p.nome, p.nickname
  from participantes p
  where p.bloqueado = false   -- bloqueado não palpita
    and not exists (
      select 1 from palpite_campeao pc where pc.participante_id = p.id
    )
  order by p.nome;
end;
$$;
