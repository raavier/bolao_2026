import type { PalpiteDeTodos } from "@/app/jogos/actions";

export type ShareJogo = {
  mandante: string;
  visitante: string;
  /** Data/hora já formatada para Brasília (ex.: "22/06 14:00"). */
  quando: string;
  /** Placar real, quando o jogo já encerrou. */
  golsMandante: number | null;
  golsVisitante: number | null;
};

/**
 * Monta a mensagem de compartilhamento dos palpites de um jogo para o WhatsApp.
 * Texto puro e legível — uma linha por participante, alinhada por "—". Inclui o
 * placar real só quando o jogo encerrou. Função pura: fácil de testar e o mesmo
 * texto serve para a URL do WhatsApp e para a área de transferência.
 */
export function buildShareText(jogo: ShareJogo, palpites: PalpiteDeTodos[]): string {
  const encerrado = jogo.golsMandante !== null && jogo.golsVisitante !== null;
  const linhas: string[] = [
    `${jogo.mandante} x ${jogo.visitante} - ${jogo.quando}`,
  ];

  if (encerrado) {
    linhas.push(`Resultado: ${jogo.golsMandante} x ${jogo.golsVisitante}`);
  }

  linhas.push("", "Palpites:");

  if (palpites.length === 0) {
    linhas.push("Ninguém palpitou neste jogo.");
  } else {
    for (const p of palpites) {
      linhas.push(`- ${p.nome}: ${p.golsMandante} x ${p.golsVisitante}`);
    }
  }

  return linhas.join("\n");
}
