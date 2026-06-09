/**
 * Mapa do nome da seleção (como gravado na tabela `jogos`) para o código de
 * bandeira do flagcdn.com. Códigos ISO 3166-1 alpha-2, exceto Inglaterra e
 * Escócia, que têm bandeiras próprias (gb-eng / gb-sct).
 *
 * Os nomes-placeholder do mata-mata (ex.: "2º Grupo A", "Vencedor J74") não
 * estão aqui de propósito — `flagCode` devolve null e a bandeira é omitida.
 */
const TEAM_FLAG_CODE: Record<string, string> = {
  Alemanha: "de",
  Argentina: "ar",
  Argélia: "dz",
  "Arábia Saudita": "sa",
  Austrália: "au",
  Brasil: "br",
  Bélgica: "be",
  "Bósnia e Herzegovina": "ba",
  "Cabo Verde": "cv",
  Canadá: "ca",
  Catar: "qa",
  Chéquia: "cz",
  Colômbia: "co",
  "Coreia do Sul": "kr",
  "Costa do Marfim": "ci",
  Croácia: "hr",
  Curaçao: "cw",
  Egito: "eg",
  Equador: "ec",
  Escócia: "gb-sct",
  Espanha: "es",
  "Estados Unidos": "us",
  França: "fr",
  Gana: "gh",
  Haiti: "ht",
  Inglaterra: "gb-eng",
  Iraque: "iq",
  Irã: "ir",
  Japão: "jp",
  Jordânia: "jo",
  Marrocos: "ma",
  México: "mx",
  Noruega: "no",
  "Nova Zelândia": "nz",
  Panamá: "pa",
  Paraguai: "py",
  "Países Baixos": "nl",
  Portugal: "pt",
  "RD Congo": "cd",
  Senegal: "sn",
  Suécia: "se",
  Suíça: "ch",
  Tunísia: "tn",
  Turquia: "tr",
  Uruguai: "uy",
  Uzbequistão: "uz",
  "África do Sul": "za",
  Áustria: "at",
};

/** Código de bandeira do time, ou null se for placeholder do mata-mata. */
export function flagCode(team: string): string | null {
  return TEAM_FLAG_CODE[team] ?? null;
}
