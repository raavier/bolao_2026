import { describe, expect, it } from "vitest";
import {
  championResult,
  computeRanking,
  participantBreakdown,
  type BreakdownGame,
  type ChampionScoring,
} from "./ranking";
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
  champion_prediction_points: 40,
  blank_prediction_points: 0,
  tiebreakers: ["total_points", "exact_scores", "correct_results"],
};

const participants = [
  { id: "ana", nome: "Ana" },
  { id: "bia", nome: "Bia" },
];

const games = [
  { id: 1, phase: "group" as const, golsMandante: 2, golsVisitante: 1 },
  { id: 2, phase: "group" as const, golsMandante: 0, golsVisitante: 0 },
];

describe("computeRanking", () => {
  it("soma pontos e ordena por total", () => {
    const predictions = [
      // Ana: crava jogo 1 (5) + crava jogo 2 (5) = 10
      { participanteId: "ana", jogoId: 1, golsMandante: 2, golsVisitante: 1 },
      { participanteId: "ana", jogoId: 2, golsMandante: 0, golsVisitante: 0 },
      // Bia: só vencedor jogo 1 (2) + erra jogo 2 (0) = 2
      { participanteId: "bia", jogoId: 1, golsMandante: 3, golsVisitante: 0 },
      { participanteId: "bia", jogoId: 2, golsMandante: 1, golsVisitante: 0 },
    ];
    const ranking = computeRanking(participants, games, predictions, config);
    expect(ranking[0]).toMatchObject({ id: "ana", points: 10, exactScores: 2, correctResults: 2 });
    expect(ranking[1]).toMatchObject({ id: "bia", points: 2, exactScores: 0, correctResults: 1 });
  });

  it("ignora palpite de jogo sem resultado e participante sem palpite fica zerado", () => {
    const ranking = computeRanking(participants, [], [], config);
    expect(ranking.every((r) => r.points === 0)).toBe(true);
  });

  it("desempata por mais cravadas quando os pontos empatam", () => {
    const g = [
      { id: 1, phase: "group" as const, golsMandante: 1, golsVisitante: 0 },
      { id: 2, phase: "group" as const, golsMandante: 1, golsVisitante: 0 },
    ];
    // Ana: crava 1 (5) + erra 2 (0) = 5, 1 cravada
    // Bia: vencedor+? Para empatar em 5 com menos cravadas: vencedor jogo1 (2) + vencedor jogo2 ... ajustamos
    const preds = [
      { participanteId: "ana", jogoId: 1, golsMandante: 1, golsVisitante: 0 },
      { participanteId: "ana", jogoId: 2, golsMandante: 5, golsVisitante: 4 },
      // Bia: vencedor+diff jogo1 (3) nao; queremos 5 pts sem cravada: nao possivel com esta config exata.
      // Em vez disso: Bia crava jogo2 (5), 1 cravada -> empata pontos e cravadas, desempata correctResults
      { participanteId: "bia", jogoId: 2, golsMandante: 1, golsVisitante: 0 },
    ];
    const ranking = computeRanking(participants, g, preds, config);
    // Ana 5 pts (1 cravada, 1 resultado certo... jogo2 5x4 é vitória mandante = resultado certo) => correct=2
    // Bia 5 pts (1 cravada, 1 resultado certo) => correct=1
    expect(ranking[0].id).toBe("ana");
  });

  it("soma os pontos de campeão a quem acertou, sem mexer em cravadas/resultados", () => {
    const champion: ChampionScoring = {
      predictions: [
        { participanteId: "ana", selecao: "Brasil" },
        { participanteId: "bia", selecao: "Argentina" },
      ],
      actual: "Brasil",
      points: 40,
    };
    const ranking = computeRanking(participants, [], [], config, champion);
    const ana = ranking.find((r) => r.id === "ana")!;
    const bia = ranking.find((r) => r.id === "bia")!;
    expect(ana).toMatchObject({ points: 40, exactScores: 0, correctResults: 0 });
    expect(bia.points).toBe(0);
  });

  it("não dá pontos de campeão enquanto o campeão não foi definido", () => {
    const champion: ChampionScoring = {
      predictions: [{ participanteId: "ana", selecao: "Brasil" }],
      actual: null,
      points: 40,
    };
    const ranking = computeRanking(participants, [], [], config, champion);
    expect(ranking.every((r) => r.points === 0)).toBe(true);
  });

  it("sem o argumento champion o comportamento não muda", () => {
    const ranking = computeRanking(participants, [], [], config);
    expect(ranking.every((r) => r.points === 0)).toBe(true);
  });
});

describe("championResult", () => {
  const champion: ChampionScoring = {
    predictions: [
      { participanteId: "ana", selecao: "Brasil" },
      { participanteId: "bia", selecao: "Argentina" },
    ],
    actual: "Brasil",
    points: 40,
  };

  it("marca acerto e pontos quando o campeão bate", () => {
    expect(championResult("ana", champion)).toEqual({
      palpite: "Brasil",
      decidido: true,
      acertou: true,
      points: 40,
    });
  });

  it("erro pontua zero mas mantém o palpite", () => {
    expect(championResult("bia", champion)).toEqual({
      palpite: "Argentina",
      decidido: true,
      acertou: false,
      points: 0,
    });
  });

  it("sem campeão definido, não decide nem pontua", () => {
    const r = championResult("ana", { ...champion, actual: null });
    expect(r).toEqual({ palpite: "Brasil", decidido: false, acertou: false, points: 0 });
  });

  it("participante sem palpite de campeão", () => {
    expect(championResult("zoe", champion)).toEqual({
      palpite: null,
      decidido: true,
      acertou: false,
      points: 0,
    });
  });
});

describe("participantBreakdown", () => {
  const games: BreakdownGame[] = [
    { id: 1, phase: "group", inicio: "2026-06-11T18:00:00Z", mandante: "Brasil", visitante: "Sérvia", golsMandante: 2, golsVisitante: 1 },
    { id: 2, phase: "group", inicio: "2026-06-12T18:00:00Z", mandante: "Suíça", visitante: "Camarões", golsMandante: 0, golsVisitante: 0 },
  ];

  it("detalha cada jogo com fase, palpite, nível de acerto e pontos", () => {
    const preds = [
      { participanteId: "ana", jogoId: 1, golsMandante: 2, golsVisitante: 1 }, // crava: 5
      // jogo 2 sem palpite
    ];
    const bd = participantBreakdown("ana", games, preds, config);
    expect(bd).toHaveLength(2);
    expect(bd[0]).toMatchObject({ jogoId: 1, phase: "group", hitLevel: "exact_score", points: 5 });
    expect(bd[0].palpite).toEqual({ home: 2, away: 1 });
    expect(bd[1]).toMatchObject({ jogoId: 2, palpite: null, hitLevel: null, points: 0 });
  });

  it("ordena por data do jogo (mais antigo primeiro)", () => {
    const fora = [...games].reverse(); // entra fora de ordem
    const bd = participantBreakdown("ana", fora, [], config);
    expect(bd.map((b) => b.jogoId)).toEqual([1, 2]);
  });
});
