/**
 * Ranking FIFA masculino congelado, pré-Copa 2026.
 *
 * Usado pelo report da rodada para medir "zebras": jogos em que a seleção mais
 * bem ranqueada tropeçou. Os nomes das chaves casam com os nomes gravados na
 * tabela `jogos` (e em src/lib/groups.ts).
 *
 * Fonte: FIFA/Coca-Cola Men's World Ranking, atualização de 11/06/2026
 * (via Yahoo Sports / Sofascore). Congelado de propósito — o report é um
 * retrato da rodada, então o ranking de referência também não muda.
 */
export const FIFA_RANKING_FONTE = "Ranking FIFA de 11/06/2026";

const FIFA_RANK: Record<string, number> = {
  Argentina: 1,
  Espanha: 2,
  França: 3,
  Inglaterra: 4,
  Portugal: 5,
  Brasil: 6,
  Marrocos: 7,
  "Países Baixos": 8,
  Bélgica: 9,
  Alemanha: 10,
  Croácia: 11,
  Colômbia: 13,
  México: 14,
  Senegal: 15,
  Uruguai: 16,
  "Estados Unidos": 17,
  Japão: 18,
  Suíça: 19,
  Irã: 20,
  Turquia: 22,
  Equador: 23,
  Áustria: 24,
  "Coreia do Sul": 25,
  Austrália: 27,
  Argélia: 28,
  Egito: 29,
  Canadá: 30,
  Noruega: 31,
  "Costa do Marfim": 33,
  Panamá: 34,
  Suécia: 38,
  Chéquia: 40,
  Paraguai: 41,
  Escócia: 42,
  Tunísia: 45,
  "RD Congo": 46,
  Uzbequistão: 50,
  Catar: 56,
  Iraque: 57,
  "África do Sul": 60,
  "Arábia Saudita": 61,
  Jordânia: 63,
  "Bósnia e Herzegovina": 64,
  "Cabo Verde": 67,
  Gana: 73,
  Curaçao: 82,
  Haiti: 83,
  "Nova Zelândia": 85,
};

/** Posição da seleção no ranking FIFA, ou null se não mapeada. */
export function fifaRank(team: string): number | null {
  return FIFA_RANK[team] ?? null;
}
