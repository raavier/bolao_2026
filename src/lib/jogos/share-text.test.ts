import { describe, expect, it } from "vitest";
import { buildShareText, type ShareJogo } from "./share-text";

const baseJogo: ShareJogo = {
  mandante: "Brasil",
  visitante: "Argentina",
  quando: "22/06 14:00",
  golsMandante: null,
  golsVisitante: null,
};

const palpites = [
  { nome: "Ana", golsMandante: 2, golsVisitante: 1 },
  { nome: "Beto", golsMandante: 0, golsVisitante: 0 },
];

describe("buildShareText", () => {
  it("monta cabeçalho, palpites e rodapé", () => {
    const texto = buildShareText(baseJogo, palpites);
    expect(texto).toContain("Brasil x Argentina - 22/06 14:00");
    expect(texto).toContain("- Ana: 2 x 1");
    expect(texto).toContain("- Beto: 0 x 0");
  });

  it("inclui o placar real quando o jogo encerrou", () => {
    const texto = buildShareText(
      { ...baseJogo, golsMandante: 3, golsVisitante: 1 },
      palpites,
    );
    expect(texto).toContain("Resultado: 3 x 1");
  });

  it("omite o placar enquanto o jogo não encerrou", () => {
    const texto = buildShareText(baseJogo, palpites);
    expect(texto).not.toContain("Resultado:");
  });

  it("trata a ausência de palpites", () => {
    const texto = buildShareText(baseJogo, []);
    expect(texto).toContain("Ninguém palpitou neste jogo.");
  });
});
