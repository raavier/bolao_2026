import { describe, expect, it } from "vitest";
import { computeGroupStandings } from "./standings";

const times = { A: ["Time1", "Time2", "Time3", "Time4"] };

describe("computeGroupStandings", () => {
  it("calcula pontos, saldo e ordena", () => {
    const games = [
      // Time1 vence Time2 por 2x0
      { grupo: "A", mandante: "Time1", visitante: "Time2", golsMandante: 2, golsVisitante: 0 },
      // Time3 empata com Time4 1x1
      { grupo: "A", mandante: "Time3", visitante: "Time4", golsMandante: 1, golsVisitante: 1 },
    ];
    const [grupoA] = computeGroupStandings(times, games);
    expect(grupoA.linhas[0]).toMatchObject({ time: "Time1", pontos: 3, saldo: 2 });
    expect(grupoA.linhas[1].pontos).toBe(1); // um dos empatados
    expect(grupoA.linhas[3]).toMatchObject({ time: "Time2", pontos: 0, saldo: -2 });
  });

  it("inclui times sem jogo com tudo zerado", () => {
    const [grupoA] = computeGroupStandings(times, []);
    expect(grupoA.linhas).toHaveLength(4);
    expect(grupoA.linhas.every((l) => l.jogos === 0 && l.pontos === 0)).toBe(true);
  });

  it("marca posição indefinida em empate total entre quem já jogou", () => {
    const games = [
      { grupo: "A", mandante: "Time1", visitante: "Time2", golsMandante: 1, golsVisitante: 1 },
      { grupo: "A", mandante: "Time3", visitante: "Time4", golsMandante: 1, golsVisitante: 1 },
    ];
    const [grupoA] = computeGroupStandings(times, games);
    // todos com 1 ponto, saldo 0, 1 gol pró -> indefinido
    expect(grupoA.posicaoIndefinida).toBe(true);
  });
});
