const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/** Data/hora de um jogo em horário de Brasília (ex.: "13/06 19:00"). */
export function formatKickoff(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}
