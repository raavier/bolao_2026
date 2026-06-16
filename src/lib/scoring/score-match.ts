import type { ScoringConfig } from "./config-schema";
import type { Phase } from "./phases";

export type Scoreline = {
  home: number;
  away: number;
};

/** Nível de acerto de um palpite em relação ao resultado real. */
export type HitLevel =
  | "exact_score"
  | "winner_and_goal_diff"
  | "winner_only"
  | "miss";

export type MatchScore = {
  hitLevel: HitLevel;
  basePoints: number;
  weight: number;
  points: number;
};

const sign = (home: number, away: number): -1 | 0 | 1 => {
  if (home > away) return 1;
  if (home < away) return -1;
  return 0;
};

/** Classifica o palpite contra o resultado real (independente de pontos). */
export function classifyHit(prediction: Scoreline, actual: Scoreline): HitLevel {
  const exact =
    prediction.home === actual.home && prediction.away === actual.away;
  if (exact) return "exact_score";

  const outcome = sign(actual.home, actual.away);
  const sameOutcome = sign(prediction.home, prediction.away) === outcome;
  if (!sameOutcome) return "miss";

  // Empate acertado sem cravar placar = "winner_and_goal_diff" (saldo 0 = 0).
  if (outcome === 0) return "winner_and_goal_diff";

  const sameGoalDiff =
    prediction.home - prediction.away === actual.home - actual.away;
  if (sameGoalDiff) return "winner_and_goal_diff";

  return "winner_only";
}

/**
 * Pontos de um único palpite de placar.
 * Função pura: mesma entrada → mesma saída. A configuração entra como
 * argumento (lida do scoring.yaml pelo chamador), nunca importada aqui,
 * para manter a fonte única e facilitar testes.
 */
export function scoreMatch(
  prediction: Scoreline,
  actual: Scoreline,
  phase: Phase,
  config: ScoringConfig,
): MatchScore {
  const hitLevel = classifyHit(prediction, actual);
  const basePoints = config.points[hitLevel];
  const weight = config.phase_weights[phase];

  const raw = basePoints * weight;
  const points = config.round_points_to_integer ? Math.round(raw) : raw;

  return { hitLevel, basePoints, weight, points };
}
