/**
 * Regra de travamento do palpite (lock_policy: per_game).
 * O palpite pode ser editado até a HORA EXATA do apito inicial do jogo.
 * Função pura — fonte única usada pela UI e pelas Server Actions; o RLS
 * no banco reforça a mesma regra (inicio > now()).
 */
export function isPredictionOpen(kickoff: Date, now: Date = new Date()): boolean {
  return now.getTime() < kickoff.getTime();
}
