/**
 * Janela em que um jogo fica "fixado" no topo da página: do apito inicial até
 * 3 horas depois (margem que cobre os ~2h de partida + acréscimos/pós-jogo).
 * Função pura — a página é renderizada no servidor, então o `now` vem do
 * horário do servidor a cada acesso.
 */
const PIN_WINDOW_MS = 3 * 60 * 60 * 1000;

/** Verdadeiro se o jogo já começou e ainda não passaram 3h do apito. */
export function isWithinPinWindow(kickoff: Date, now: Date = new Date()): boolean {
  const start = kickoff.getTime();
  return now.getTime() >= start && now.getTime() < start + PIN_WINDOW_MS;
}
