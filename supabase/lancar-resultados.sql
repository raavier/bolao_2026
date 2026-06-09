-- ============================================================================
-- Atalho para lançar vários resultados de uma vez (opção C).
-- Cole no SQL Editor do Supabase, ajuste os números e RUN.
-- O id é o número oficial do jogo (1 a 104). Veja a lista em scripts/fixtures.json
-- ou na tela /jogos do site.
--
-- Formato: (id_do_jogo, gols_mandante, gols_visitante)
-- ============================================================================

update jogos as j set
  gols_mandante = v.gm,
  gols_visitante = v.gv,
  status = 'encerrado'
from (values
  -- EDITE AQUI. Exemplos (apague e ponha os reais):
  (1, 2, 1),   -- jogo 1: México 2 x 1 África do Sul
  (2, 0, 0)    -- jogo 2: Coreia do Sul 0 x 0 Chéquia
  -- , (7, 3, 1)  -- pode adicionar mais linhas, separadas por vírgula
) as v(id, gm, gv)
where j.id = v.id;

-- Para CORRIGIR/reabrir um jogo (limpar placar):
-- update jogos set gols_mandante=null, gols_visitante=null, status='agendado' where id = 7;
