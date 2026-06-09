/**
 * Classificação da fase de grupos a partir dos jogos encerrados.
 * Função pura, sem dependência de banco.
 *
 * Critérios de desempate aplicados (ordem): pontos, saldo de gols, gols pró.
 * A FIFA usa mais critérios (confronto direto, fair play, ranking) em empates
 * persistentes — esses casos raros devem ser resolvidos manualmente pelo admin
 * ao definir os confrontos do mata-mata. Ver `posicaoIndefinida`.
 */

export type StandingsGame = {
  grupo: string;
  mandante: string;
  visitante: string;
  golsMandante: number;
  golsVisitante: number;
};

export type StandingRow = {
  time: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldo: number;
  pontos: number;
};

export type GroupStanding = {
  grupo: string;
  linhas: StandingRow[];
  /** true se há empate em pontos+saldo+gols pró que estes critérios não resolvem. */
  posicaoIndefinida: boolean;
};

const novaLinha = (time: string): StandingRow => ({
  time,
  jogos: 0,
  vitorias: 0,
  empates: 0,
  derrotas: 0,
  golsPro: 0,
  golsContra: 0,
  saldo: 0,
  pontos: 0,
});

/**
 * Calcula a classificação de cada grupo.
 * @param times mapa grupo -> times daquele grupo (para mostrar todos, mesmo sem jogo)
 * @param games jogos encerrados da fase de grupos
 */
export function computeGroupStandings(
  times: Record<string, string[]>,
  games: StandingsGame[],
): GroupStanding[] {
  const porGrupo = new Map<string, Map<string, StandingRow>>();

  for (const [grupo, lista] of Object.entries(times)) {
    const linhas = new Map<string, StandingRow>();
    for (const time of lista) linhas.set(time, novaLinha(time));
    porGrupo.set(grupo, linhas);
  }

  for (const game of games) {
    const linhas = porGrupo.get(game.grupo);
    if (!linhas) continue;
    const casa = linhas.get(game.mandante) ?? novaLinha(game.mandante);
    const fora = linhas.get(game.visitante) ?? novaLinha(game.visitante);
    linhas.set(game.mandante, casa);
    linhas.set(game.visitante, fora);

    casa.jogos += 1;
    fora.jogos += 1;
    casa.golsPro += game.golsMandante;
    casa.golsContra += game.golsVisitante;
    fora.golsPro += game.golsVisitante;
    fora.golsContra += game.golsMandante;

    if (game.golsMandante > game.golsVisitante) {
      casa.vitorias += 1;
      casa.pontos += 3;
      fora.derrotas += 1;
    } else if (game.golsMandante < game.golsVisitante) {
      fora.vitorias += 1;
      fora.pontos += 3;
      casa.derrotas += 1;
    } else {
      casa.empates += 1;
      fora.empates += 1;
      casa.pontos += 1;
      fora.pontos += 1;
    }
  }

  const resultado: GroupStanding[] = [];
  for (const [grupo, linhasMap] of [...porGrupo.entries()].sort()) {
    const linhas = [...linhasMap.values()];
    for (const l of linhas) l.saldo = l.golsPro - l.golsContra;

    linhas.sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.saldo - a.saldo ||
        b.golsPro - a.golsPro ||
        a.time.localeCompare(b.time),
    );

    // Detecta empate não resolvido pelos critérios (pontos+saldo+gols pró iguais).
    let posicaoIndefinida = false;
    for (let i = 1; i < linhas.length; i++) {
      const a = linhas[i - 1];
      const b = linhas[i];
      if (
        a.jogos > 0 &&
        a.pontos === b.pontos &&
        a.saldo === b.saldo &&
        a.golsPro === b.golsPro
      ) {
        posicaoIndefinida = true;
      }
    }

    resultado.push({ grupo, linhas, posicaoIndefinida });
  }

  return resultado;
}
