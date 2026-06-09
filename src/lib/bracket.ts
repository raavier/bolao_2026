/**
 * Mapa de propagação do mata-mata: para cada jogo de origem, diz para qual
 * jogo e em qual lado vão o VENCEDOR (W) e, quando aplicável, o PERDEDOR (L).
 * Extraído dos placeholders oficiais ("Vencedor J74" etc.) em fixtures.json.
 *
 * Ex.: o vencedor do jogo 73 vai para o jogo 90, lado mandante (home).
 *      o perdedor do jogo 101 (semi) vai para o jogo 103 (disputa de 3º).
 */
export type BracketTarget = { jogo: number; slot: "home" | "away" };

export const BRACKET_MAP: Record<number, { W?: BracketTarget; L?: BracketTarget }> = {
  73: { W: { jogo: 90, slot: "home" } },
  74: { W: { jogo: 89, slot: "home" } },
  75: { W: { jogo: 90, slot: "away" } },
  76: { W: { jogo: 91, slot: "home" } },
  77: { W: { jogo: 89, slot: "away" } },
  78: { W: { jogo: 91, slot: "away" } },
  79: { W: { jogo: 92, slot: "home" } },
  80: { W: { jogo: 92, slot: "away" } },
  81: { W: { jogo: 94, slot: "home" } },
  82: { W: { jogo: 94, slot: "away" } },
  83: { W: { jogo: 93, slot: "home" } },
  84: { W: { jogo: 93, slot: "away" } },
  85: { W: { jogo: 96, slot: "home" } },
  86: { W: { jogo: 95, slot: "home" } },
  87: { W: { jogo: 96, slot: "away" } },
  88: { W: { jogo: 95, slot: "away" } },
  89: { W: { jogo: 97, slot: "home" } },
  90: { W: { jogo: 97, slot: "away" } },
  91: { W: { jogo: 99, slot: "home" } },
  92: { W: { jogo: 99, slot: "away" } },
  93: { W: { jogo: 98, slot: "home" } },
  94: { W: { jogo: 98, slot: "away" } },
  95: { W: { jogo: 100, slot: "home" } },
  96: { W: { jogo: 100, slot: "away" } },
  97: { W: { jogo: 101, slot: "home" } },
  98: { W: { jogo: 101, slot: "away" } },
  99: { W: { jogo: 102, slot: "home" } },
  100: { W: { jogo: 102, slot: "away" } },
  101: { L: { jogo: 103, slot: "home" }, W: { jogo: 104, slot: "home" } },
  102: { L: { jogo: 103, slot: "away" }, W: { jogo: 104, slot: "away" } },
};

/** Coluna do banco correspondente ao slot (mandante/visitante). */
export const SLOT_COLUMN = {
  home: "mandante",
  away: "visitante",
} as const;
