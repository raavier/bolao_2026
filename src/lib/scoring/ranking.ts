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
};

export type BreakdownItem = {
  jogoId: number;
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
 * claro o que a pessoa deixou passar. Ordena por mais pontos primeiro.
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
        mandante: game.mandante,
        visitante: game.visitante,
        resultado: actual,
        palpite: predScore,
        hitLevel,
        points,
      };
    })
    .sort((a, b) => b.points - a.points || a.jogoId - b.jogoId);
}
