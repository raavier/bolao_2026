/**
 * Os 12 grupos da Copa 2026 e suas seleções (nomes como gravados em `jogos`).
 * Usado pela classificação dos grupos e pelos selects de admin do mata-mata.
 */
export const GROUPS: Record<string, string[]> = {
  A: ["México", "África do Sul", "Coreia do Sul", "Chéquia"],
  B: ["Canadá", "Bósnia e Herzegovina", "Catar", "Suíça"],
  C: ["Brasil", "Marrocos", "Haiti", "Escócia"],
  D: ["Estados Unidos", "Paraguai", "Austrália", "Turquia"],
  E: ["Alemanha", "Curaçao", "Costa do Marfim", "Equador"],
  F: ["Países Baixos", "Japão", "Suécia", "Tunísia"],
  G: ["Bélgica", "Egito", "Irã", "Nova Zelândia"],
  H: ["Espanha", "Cabo Verde", "Arábia Saudita", "Uruguai"],
  I: ["França", "Senegal", "Iraque", "Noruega"],
  J: ["Argentina", "Argélia", "Áustria", "Jordânia"],
  K: ["Portugal", "RD Congo", "Uzbequistão", "Colômbia"],
  L: ["Inglaterra", "Croácia", "Gana", "Panamá"],
};

/** Lista achatada de todas as 48 seleções (ordenada), para os selects de admin. */
export const ALL_TEAMS: string[] = Object.values(GROUPS)
  .flat()
  .sort((a, b) => a.localeCompare(b));
