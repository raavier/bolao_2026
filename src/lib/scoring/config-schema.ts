import { z } from "zod";
import { PHASES } from "./phases";

/**
 * Schema do config/scoring.yaml — fonte única das regras de pontuação.
 * Validar aqui no boot evita calcular pontos com configuração inválida.
 */

const phaseWeights = z.object(
  Object.fromEntries(PHASES.map((phase) => [phase, z.number().positive()])),
) as z.ZodObject<Record<(typeof PHASES)[number], z.ZodNumber>>;

export const scoringConfigSchema = z.object({
  lock_policy: z.enum(["per_game", "per_phase"]),
  knockout_score_basis: z.enum(["regular_plus_extra_time", "regular_only"]),
  points: z.object({
    exact_score: z.number(),
    winner_and_goal_diff: z.number(),
    winner_only: z.number(),
    miss: z.number(),
  }),
  phase_weights: phaseWeights,
  round_points_to_integer: z.boolean(),
  champion_prediction_points: z.number(),
  blank_prediction_points: z.number(),
  tiebreakers: z
    .array(z.enum(["total_points", "exact_scores", "correct_results"]))
    .min(1),
});

export type ScoringConfig = z.infer<typeof scoringConfigSchema>;
