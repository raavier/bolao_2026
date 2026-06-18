import { describe, expect, it } from "vitest";
import { computeReport, type RodadaSnapshot } from "./compute";
import type { ScoringConfig } from "../scoring/config-schema";

const config: ScoringConfig = {
  lock_policy: "per_game",
  knockout_score_basis: "regular_plus_extra_time",
  points: { exact_score: 5, winner_and_goal_diff: 3, winner_only: 2, miss: 0 },
  phase_weights: {
    group: 1,
    round_of_32: 1,
    round_of_16: 2,
    quarter_finals: 4,
    semi_finals: 5.5,
    third_place: 5.5,
    final: 7.5,
  },
  round_points_to_integer: false,
  champion_prediction_points: 40,
  blank_prediction_points: 0,
  tiebreakers: ["total_points", "exact_scores", "correct_results"],
};

function snapshot(over: Partial<RodadaSnapshot> = {}): RodadaSnapshot {
  return {
    rodada: 1,
    ultimoJogo: 24,
    geradoEm: "2026-06-18T00:00:00Z",
    participantes: [],
    jogos: [],
    palpites: [],
    logs: [],
    comentarios: {},
    ...over,
  };
}

const jogo = (
  id: number,
  mandante: string,
  visitante: string,
  gm: number,
  gv: number,
  inicio = "2026-06-11T19:00:00Z",
) => ({
  id,
  fase: "group" as const,
  grupo: "A",
  inicio,
  mandante,
  visitante,
  gols_mandante: gm,
  gols_visitante: gv,
});

describe("computeReport — ranking e pódio", () => {
  it("soma pontos da rodada e ordena", () => {
    const r = computeReport(
      snapshot({
        participantes: [
          { id: "ana", nome: "Ana", nickname: null, bloqueado: false },
          { id: "bia", nome: "Bia", nickname: null, bloqueado: false },
        ],
        jogos: [jogo(1, "Brasil", "Sérvia", 2, 1)],
        palpites: [
          { participante_id: "ana", jogo_id: 1, gols_mandante: 2, gols_visitante: 1 }, // crava 5
          { participante_id: "bia", jogo_id: 1, gols_mandante: 3, gols_visitante: 0 }, // só vencedor 2
        ],
      }),
      config,
    );
    expect(r.ranking[0]).toMatchObject({ id: "ana", points: 5, exactScores: 1 });
    expect(r.ranking[1]).toMatchObject({ id: "bia", points: 2, exactScores: 0 });
    expect(r.totalJogos).toBe(1);
    expect(r.totalParticipantes).toBe(2);
  });

  it("ignora participante bloqueado", () => {
    const r = computeReport(
      snapshot({
        participantes: [
          { id: "ana", nome: "Ana", nickname: null, bloqueado: false },
          { id: "x", nome: "Bloqueado", nickname: null, bloqueado: true },
        ],
        jogos: [jogo(1, "A", "B", 1, 0)],
        palpites: [
          { participante_id: "ana", jogo_id: 1, gols_mandante: 1, gols_visitante: 0 },
          { participante_id: "x", jogo_id: 1, gols_mandante: 1, gols_visitante: 0 },
        ],
      }),
      config,
    );
    expect(r.totalParticipantes).toBe(1);
    expect(r.ranking).toHaveLength(1);
  });

  it("desempate de pódio coloca Caique à frente de Bruno em empate de pontos", () => {
    const r = computeReport(
      snapshot({
        participantes: [
          { id: "bru", nome: "Bruno Emerick", nickname: null, bloqueado: false },
          { id: "cai", nome: "Caique Florentino", nickname: null, bloqueado: false },
        ],
        jogos: [jogo(1, "A", "B", 1, 0)],
        palpites: [
          { participante_id: "bru", jogo_id: 1, gols_mandante: 1, gols_visitante: 0 },
          { participante_id: "cai", jogo_id: 1, gols_mandante: 1, gols_visitante: 0 },
        ],
      }),
      config,
    );
    // Empatam em 5 pts; a zoeira CR7×Messi põe Caique em 1º.
    expect(r.podio[0].nome).toContain("Caique");
    expect(r.podio[1].nome).toContain("Bruno");
    expect(r.podio[0].points).toBe(r.podio[1].points);
  });

  it("não inverte Caique/Bruno se Bruno tiver mais pontos", () => {
    const r = computeReport(
      snapshot({
        participantes: [
          { id: "bru", nome: "Bruno Emerick", nickname: null, bloqueado: false },
          { id: "cai", nome: "Caique Florentino", nickname: null, bloqueado: false },
        ],
        jogos: [jogo(1, "A", "B", 2, 0)],
        palpites: [
          { participante_id: "bru", jogo_id: 1, gols_mandante: 2, gols_visitante: 0 }, // crava 5
          { participante_id: "cai", jogo_id: 1, gols_mandante: 1, gols_visitante: 0 }, // vencedor 2
        ],
      }),
      config,
    );
    expect(r.podio[0].nome).toContain("Bruno");
  });
});

describe("computeReport — agregações de jogo", () => {
  const base = snapshot({
    participantes: [
      { id: "a", nome: "A", nickname: null, bloqueado: false },
      { id: "b", nome: "B", nickname: null, bloqueado: false },
    ],
    jogos: [
      jogo(1, "Austrália", "Turquia", 2, 0), // ninguém acerta (ambos chutam visitante)
      jogo(2, "Brasil", "Sérvia", 1, 0), // os dois cravam
    ],
    palpites: [
      { participante_id: "a", jogo_id: 1, gols_mandante: 0, gols_visitante: 1 },
      { participante_id: "b", jogo_id: 1, gols_mandante: 0, gols_visitante: 2 },
      { participante_id: "a", jogo_id: 2, gols_mandante: 1, gols_visitante: 0 },
      { participante_id: "b", jogo_id: 2, gols_mandante: 1, gols_visitante: 0 },
    ],
  });

  it("ranking de placares conta os mais palpitados", () => {
    // jogo 1: 0x1 e 0x2 → normalizam para 1x0 e 2x0; jogo 2: 1x0 e 1x0.
    // Com simetria, 1x0 aparece 3 vezes (0x1, 1x0, 1x0).
    const r = computeReport(base, config);
    const top = r.placarNacional[0];
    expect(top.placar).toBe("1x0");
    expect(top.vezes).toBe(3);
  });

  it("ranking de placares soma simétricos (2x0 = 0x2)", () => {
    const r = computeReport(
      snapshot({
        participantes: [
          { id: "a", nome: "A", nickname: null, bloqueado: false },
          { id: "b", nome: "B", nickname: null, bloqueado: false },
        ],
        jogos: [jogo(1, "X", "Y", 1, 1)],
        palpites: [
          { participante_id: "a", jogo_id: 1, gols_mandante: 2, gols_visitante: 0 },
          { participante_id: "b", jogo_id: 1, gols_mandante: 0, gols_visitante: 2 },
        ],
      }),
      config,
    );
    expect(r.placarNacional[0]).toEqual({ placar: "2x0", vezes: 2 });
  });

  it("zebra: jogo que ninguém acertou o vencedor aparece primeiro", () => {
    const r = computeReport(base, config);
    expect(r.zebrasNinguemViu[0].jogoId).toBe(1);
    expect(r.zebrasNinguemViu[0].acertaramVencedor).toBe(0);
    expect(r.zebrasNinguemViu[0].quemViu).toEqual([]);
  });

  it("zebra: quando 1-2 pessoas acertam, registra quem viu", () => {
    const r = computeReport(
      snapshot({
        participantes: [
          { id: "a", nome: "Vidente", nickname: null, bloqueado: false },
          { id: "b", nome: "Errou", nickname: null, bloqueado: false },
        ],
        jogos: [jogo(1, "Brasil", "Marrocos", 1, 1)],
        palpites: [
          { participante_id: "a", jogo_id: 1, gols_mandante: 1, gols_visitante: 1 }, // acertou empate
          { participante_id: "b", jogo_id: 1, gols_mandante: 2, gols_visitante: 0 }, // errou
        ],
      }),
      config,
    );
    expect(r.zebrasNinguemViu[0].acertaramVencedor).toBe(1);
    expect(r.zebrasNinguemViu[0].quemViu).toEqual(["Vidente"]);
  });

  it("moleza: jogo mais cravado em conjunto", () => {
    const r = computeReport(base, config);
    expect(r.molezas[0].jogoId).toBe(2);
    expect(r.molezas[0].cravaram).toBe(2);
  });

  it("zebra FIFA: favorito que tropeçou entra com gap correto", () => {
    // Gana (#73) vence Panamá (#34) → gap 39
    const r = computeReport(
      snapshot({
        participantes: [{ id: "a", nome: "A", nickname: null, bloqueado: false }],
        jogos: [jogo(1, "Gana", "Panamá", 1, 0)],
        palpites: [{ participante_id: "a", jogo_id: 1, gols_mandante: 1, gols_visitante: 0 }],
      }),
      config,
    );
    expect(r.zebrasFifa[0]).toMatchObject({
      mandante: "Gana",
      visitante: "Panamá",
      gap: 39,
    });
  });
});

describe("computeReport — perfis e pares", () => {
  it("goleador tem mais gols por jogo que o cauteloso", () => {
    const r = computeReport(
      snapshot({
        participantes: [
          { id: "g", nome: "Goleador", nickname: null, bloqueado: false },
          { id: "c", nome: "Cauteloso", nickname: null, bloqueado: false },
        ],
        jogos: [jogo(1, "A", "B", 1, 1)],
        palpites: [
          { participante_id: "g", jogo_id: 1, gols_mandante: 4, gols_visitante: 3 },
          { participante_id: "c", jogo_id: 1, gols_mandante: 1, gols_visitante: 0 },
        ],
      }),
      config,
    );
    expect(r.goleadores[0].id).toBe("g");
    expect(r.cautelosos[0].id).toBe("c");
  });

  it("gêmeos: par com mais placares idênticos", () => {
    const r = computeReport(
      snapshot({
        participantes: [
          { id: "a", nome: "A", nickname: null, bloqueado: false },
          { id: "b", nome: "B", nickname: null, bloqueado: false },
        ],
        jogos: [jogo(1, "X", "Y", 1, 0), jogo(2, "W", "Z", 2, 2)],
        palpites: [
          { participante_id: "a", jogo_id: 1, gols_mandante: 1, gols_visitante: 0 },
          { participante_id: "b", jogo_id: 1, gols_mandante: 1, gols_visitante: 0 },
          { participante_id: "a", jogo_id: 2, gols_mandante: 0, gols_visitante: 0 },
          { participante_id: "b", jogo_id: 2, gols_mandante: 3, gols_visitante: 1 },
        ],
      }),
      config,
    );
    expect(r.gemeos[0]).toMatchObject({ iguais: 1, total: 2 });
  });
});

describe("computeReport — comportamento (logs)", () => {
  const parts = [{ id: "a", nome: "Apressado", nickname: null, bloqueado: false }];
  const jogos = [jogo(1, "A", "B", 1, 0, "2026-06-11T19:00:00Z")];

  it("em cima do apito mede minutos até o início (último save)", () => {
    const r = computeReport(
      snapshot({
        participantes: parts,
        jogos,
        palpites: [{ participante_id: "a", jogo_id: 1, gols_mandante: 1, gols_visitante: 0 }],
        logs: [
          { participante_id: "a", jogo_id: 1, gols_mandante: 0, gols_visitante: 0, criado_em: "2026-06-11T10:00:00Z" },
          { participante_id: "a", jogo_id: 1, gols_mandante: 1, gols_visitante: 0, criado_em: "2026-06-11T18:55:00Z" }, // 5 min antes
        ],
      }),
      config,
    );
    expect(r.emCimaDoApito[0]).toMatchObject({ jogoId: 1, minutos: 5 });
  });

  it("indeciso conta trocas (saves além do primeiro por jogo)", () => {
    const r = computeReport(
      snapshot({
        participantes: parts,
        jogos,
        palpites: [{ participante_id: "a", jogo_id: 1, gols_mandante: 1, gols_visitante: 0 }],
        logs: [
          { participante_id: "a", jogo_id: 1, gols_mandante: 0, gols_visitante: 0, criado_em: "2026-06-11T10:00:00Z" },
          { participante_id: "a", jogo_id: 1, gols_mandante: 2, gols_visitante: 0, criado_em: "2026-06-11T12:00:00Z" },
          { participante_id: "a", jogo_id: 1, gols_mandante: 1, gols_visitante: 0, criado_em: "2026-06-11T13:00:00Z" },
        ],
      }),
      config,
    );
    expect(r.indecisos[0]).toMatchObject({ saves: 3, trocas: 2 });
  });
});

describe("computeReport — comentários do Neto", () => {
  it("inclui apenas comentários presentes no snapshot, na ordem do ranking", () => {
    const r = computeReport(
      snapshot({
        participantes: [
          { id: "a", nome: "Líder", nickname: null, bloqueado: false },
          { id: "b", nome: "Vice", nickname: null, bloqueado: false },
        ],
        jogos: [jogo(1, "A", "B", 1, 0)],
        palpites: [
          { participante_id: "a", jogo_id: 1, gols_mandante: 1, gols_visitante: 0 },
          { participante_id: "b", jogo_id: 1, gols_mandante: 2, gols_visitante: 1 },
        ],
        comentarios: { a: "Ow garotinho!" },
      }),
      config,
    );
    expect(r.comentarios).toHaveLength(1);
    expect(r.comentarios[0]).toMatchObject({ id: "a", texto: "Ow garotinho!" });
  });
});
