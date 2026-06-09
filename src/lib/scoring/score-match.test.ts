import { describe, expect, it } from "vitest";
import { classifyHit, scoreMatch } from "./score-match";
import type { ScoringConfig } from "./config-schema";

const config: ScoringConfig = {
  lock_policy: "per_game",
  knockout_score_basis: "regular_plus_extra_time",
  points: { exact_score: 5, winner_and_goal_diff: 3, winner_only: 2, miss: 0 },
  phase_weights: {
    group: 1,
    round_of_32: 1,
    round_of_16: 1.5,
    quarter_finals: 2,
    semi_finals: 2.5,
    third_place: 2.5,
    final: 3,
  },
  round_points_to_integer: false,
  blank_prediction_points: 0,
  tiebreakers: ["total_points", "exact_scores", "correct_results"],
};

describe("classifyHit — resultado real 3x1 (vitória do mandante)", () => {
  const actual = { home: 3, away: 1 };

  it("placar exato", () => {
    expect(classifyHit({ home: 3, away: 1 }, actual)).toBe("exact_score");
  });

  it("vencedor + diferença de gols (2x0)", () => {
    expect(classifyHit({ home: 2, away: 0 }, actual)).toBe("winner_and_goal_diff");
  });

  it("só o vencedor, diferença errada (2x1)", () => {
    expect(classifyHit({ home: 2, away: 1 }, actual)).toBe("winner_only");
  });

  it("vencedor errado (0x1)", () => {
    expect(classifyHit({ home: 0, away: 1 }, actual)).toBe("miss");
  });
});

describe("classifyHit — resultado real 2x2 (empate)", () => {
  const actual = { home: 2, away: 2 };

  it("placar exato de empate", () => {
    expect(classifyHit({ home: 2, away: 2 }, actual)).toBe("exact_score");
  });

  it("acertou que foi empate, placar errado (3x3) → winner_only", () => {
    expect(classifyHit({ home: 3, away: 3 }, actual)).toBe("winner_only");
  });

  it("palpitou vitória, deu empate (1x0) → miss", () => {
    expect(classifyHit({ home: 1, away: 0 }, actual)).toBe("miss");
  });
});

describe("scoreMatch — pontos com peso de fase", () => {
  const actual = { home: 3, away: 1 };

  it("placar exato na fase de grupos = 5", () => {
    expect(scoreMatch({ home: 3, away: 1 }, actual, "group", config).points).toBe(5);
  });

  it("placar exato nas oitavas (1.5x) = 7.5", () => {
    expect(scoreMatch({ home: 3, away: 1 }, actual, "round_of_16", config).points).toBe(7.5);
  });

  it("placar exato na final (3x) = 15", () => {
    expect(scoreMatch({ home: 3, away: 1 }, actual, "final", config).points).toBe(15);
  });

  it("vencedor+dif nas quartas (3 * 2) = 6", () => {
    expect(scoreMatch({ home: 2, away: 0 }, actual, "quarter_finals", config).points).toBe(6);
  });

  it("arredonda quando configurado", () => {
    const rounded = { ...config, round_points_to_integer: true };
    expect(scoreMatch({ home: 3, away: 1 }, actual, "round_of_16", rounded).points).toBe(8);
  });
});
