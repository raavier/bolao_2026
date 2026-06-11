-- ============================================================================
-- Bolão Copa 2026 — migração 0009
-- Estatística para admins: quem tem palpites em branco a vencer.
--
-- Por que uma função SECURITY DEFINER: a policy RLS de palpites
-- (palpites_select_self_or_started, 0001) impede que o admin leia palpites
-- alheios de jogos que ainda NÃO começaram — justamente a janela que nos
-- interessa. A função roda com privilégios do dono (bypass RLS), mas:
--   1) só responde a admins (checa is_admin());
--   2) retorna SOMENTE nomes e contagens — JAMAIS o conteúdo (gols) dos palpites.
-- Mesmo padrão de set_nickname (0005). Idempotente.
-- ============================================================================

create or replace function palpites_em_branco(janela_horas int default 8)
returns table (
  participante_id uuid,
  nome text,
  nickname text,
  em_branco_janela bigint,
  em_branco_total  bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Apenas administradores.';
  end if;

  return query
  with futuros as (
    -- jogos que ainda não começaram (palpite ainda editável)
    select j.id, j.inicio from jogos j where j.inicio > now()
  ),
  combos as (
    -- todo participante ativo × todo jogo futuro
    select p.id as pid, p.nome, p.nickname, f.id as jid, f.inicio
    from participantes p
    cross join futuros f
    where p.bloqueado = false   -- bloqueado não palpita; não faz sentido cobrar
  )
  select
    c.pid,
    c.nome,
    c.nickname,
    count(*) filter (
      where pl.jogo_id is null
        and c.inicio <= now() + make_interval(hours => janela_horas)
    ) as em_branco_janela,
    count(*) filter (where pl.jogo_id is null) as em_branco_total
  from combos c
  left join palpites pl
    on pl.participante_id = c.pid and pl.jogo_id = c.jid
  group by c.pid, c.nome, c.nickname
  having count(*) filter (where pl.jogo_id is null) > 0
  order by em_branco_janela desc, em_branco_total desc, c.nome;
end;
$$;
