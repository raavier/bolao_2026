import type { ScoringConfig } from "./config-schema";
import type { Phase } from "./phases";
import {
  classifyHit,
  scoreMatch,
  type HitLevel,
  type Scoreline,
} from "./score-match";

export type RankingGame = {
  id: number;
  phase: Phase;
  golsMandante: number;
  golsVisitante: number;
};

export type BreakdownGame = RankingGame & {
  mandante: string;
  visitante: string;
  inicio: string;
};

export type BreakdownItem = {
  jogoId: number;
  phase: Phase;
  inicio: string;
  mandante: string;
  visitante: string;
  resultado: { home: number; away: number };
  palpite: { home: number; away: number } | null;
  hitLevel: HitLevel | null;
  points: number;
};

export type RankingPrediction = {
  participanteId: string;
  jogoId: number;
  golsMandante: number;
  golsVisitante: number;
};

export type RankingParticipant = {
  id: string;
  nome: string;
};

export type RankingRow = {
  id: string;
  nome: string;
  points: number;
  exactScores: number;
  correctResults: number;
};

export type ChampionPrediction = {
  participanteId: string;
  selecao: string;
};

/**
 * Dados do palpite de campeão para o ranking: quem palpitou o quê, qual a
 * seleção campeã de verdade (null enquanto o admin não define) e quantos
 * pontos vale acertar. Mantido separado dos palpites de placar.
 */
export type ChampionScoring = {
  predictions: ChampionPrediction[];
  actual: string | null;
  points: number;
};

export type ChampionResult = {
  palpite: string | null;
  decidido: boolean;
  acertou: boolean;
  points: number;
};

/**
 * Calcula o ranking a partir dos jogos encerrados, dos palpites e da config.
 * Função pura: só considera jogos com placar definido. Empate é resolvido por
 * mais cravadas e depois mais resultados certos (config.tiebreakers).
 */
export function computeRanking(
  participants: RankingParticipant[],
  games: RankingGame[],
  predictions: RankingPrediction[],
  config: ScoringConfig,
  champion?: ChampionScoring,
): RankingRow[] {
  const gameById = new Map(games.map((game) => [game.id, game]));
  const rows = new Map<string, RankingRow>(
    participants.map((p) => [
      p.id,
      { id: p.id, nome: p.nome, points: 0, exactScores: 0, correctResults: 0 },
    ]),
  );

  for (const prediction of predictions) {
    const game = gameById.get(prediction.jogoId);
    const row = rows.get(prediction.participanteId);
    if (!game || !row) continue;

    const predScore: Scoreline = {
      home: prediction.golsMandante,
      away: prediction.golsVisitante,
    };
    const actual: Scoreline = {
      home: game.golsMandante,
      away: game.golsVisitante,
    };

    const { points } = scoreMatch(predScore, actual, game.phase, config);
    row.points += points;

    const hit = classifyHit(predScore, actual);
    if (hit === "exact_score") row.exactScores += 1;
    if (hit !== "miss") row.correctResults += 1;
  }

  // Palpite de campeão: só soma pontos (não conta como cravada/resultado).
  // Enquanto o admin não definir o campeão (actual = null), ninguém pontua.
  if (champion?.actual) {
    for (const prediction of champion.predictions) {
      const row = rows.get(prediction.participanteId);
      if (row && prediction.selecao === champion.actual) {
        row.points += champion.points;
      }
    }
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.exactScores - a.exactScores ||
      b.correctResults - a.correctResults ||
      a.nome.localeCompare(b.nome),
  );
}

/**
 * Detalha, jogo a jogo, de onde um participante ganhou (ou não) pontos.
 * Só considera jogos encerrados. Inclui jogos sem palpite (0 pts), para deixar
 * claro o que a pessoa deixou passar. Ordena por data do jogo (mais antigo
 * primeiro).
 */
export function participantBreakdown(
  participanteId: string,
  games: BreakdownGame[],
  predictions: RankingPrediction[],
  config: ScoringConfig,
): BreakdownItem[] {
  const palpitePorJogo = new Map(
    predictions
      .filter((p) => p.participanteId === participanteId)
      .map((p) => [p.jogoId, p]),
  );

  return games
    .map((game) => {
      const actual: Scoreline = { home: game.golsMandante, away: game.golsVisitante };
      const palpite = palpitePorJogo.get(game.id);

      if (!palpite) {
        return {
          jogoId: game.id,
          phase: game.phase,
          inicio: game.inicio,
          mandante: game.mandante,
          visitante: game.visitante,
          resultado: actual,
          palpite: null,
          hitLevel: null,
          points: 0,
        };
      }

      const predScore: Scoreline = { home: palpite.golsMandante, away: palpite.golsVisitante };
      const { points, hitLevel } = scoreMatch(predScore, actual, game.phase, config);
      return {
        jogoId: game.id,
        phase: game.phase,
        inicio: game.inicio,
        mandante: game.mandante,
        visitante: game.visitante,
        resultado: actual,
        palpite: predScore,
        hitLevel,
        points,
      };
    })
    .sort((a, b) => a.inicio.localeCompare(b.inicio) || a.jogoId - b.jogoId);
}

/**
 * Resumo do palpite de campeão de um participante, para o detalhamento do
 * ranking. `decidido` indica se o admin já definiu o campeão; só aí `acertou`
 * e `points` fazem sentido. Pura — espelha a regra de pontos de computeRanking.
 */
export function championResult(
  participanteId: string,
  champion: ChampionScoring,
): ChampionResult {
  const palpite =
    champion.predictions.find((p) => p.participanteId === participanteId)
      ?.selecao ?? null;
  const decidido = champion.actual !== null;
  const acertou = decidido && palpite !== null && palpite === champion.actual;

  return {
    palpite,
    decidido,
    acertou,
    points: acertou ? champion.points : 0,
  };
}
