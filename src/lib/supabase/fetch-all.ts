import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Tamanho da página. O PostgREST (API do Supabase) devolve no máximo 1000
 * linhas por resposta por padrão — uma leitura em massa maior que isso é
 * truncada SILENCIOSAMENTE (sem erro). Paginamos com `range` para trazer tudo.
 */
const PAGE_SIZE = 1000;

/**
 * Executa uma query do Supabase página a página até esgotar as linhas, driblando
 * o teto de 1000 linhas por resposta do PostgREST.
 *
 * O chamador recebe uma função `page(from, to)` e deve devolver a query já
 * montada com `.range(from, to)` aplicado — normalmente uma leitura ordenada por
 * uma coluna estável (ex.: a PK), para as páginas não se sobreporem nem pularem
 * linhas quando os dados mudam entre as buscas.
 *
 * @example
 * const palpites = await fetchAll((from, to) =>
 *   supabase
 *     .from("palpites")
 *     .select("participante_id, jogo_id, gols_mandante, gols_visitante")
 *     .in("jogo_id", jogoIds)
 *     .order("id")
 *     .range(from, to),
 * );
 */
export async function fetchAll<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
): Promise<T[]> {
  const all: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    const rows = data ?? [];
    all.push(...rows);

    // Página incompleta = chegou ao fim. (Página cheia pode ou não ter mais;
    // buscamos a próxima e paramos quando vier vazia/incompleta.)
    if (rows.length < PAGE_SIZE) break;
  }

  return all;
}
