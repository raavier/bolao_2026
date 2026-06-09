/**
 * Fases do torneio. As chaves casam exatamente com `phase_weights`
 * no config/scoring.yaml e com o enum `fase` da tabela `jogos`.
 */
export const PHASES = [
  "group",
  "round_of_32",
  "round_of_16",
  "quarter_finals",
  "semi_finals",
  "third_place",
  "final",
] as const;

export type Phase = (typeof PHASES)[number];

/** Rótulos em português para exibição (página de regras, telas). */
export const PHASE_LABELS: Record<Phase, string> = {
  group: "Fase de grupos",
  round_of_32: "32 avos de final",
  round_of_16: "Oitavas de final",
  quarter_finals: "Quartas de final",
  semi_finals: "Semifinais",
  third_place: "Disputa de 3º lugar",
  final: "Final",
};

/** Rótulos curtos para chips/badges ao lado das partidas. */
export const PHASE_SHORT_LABELS: Record<Phase, string> = {
  group: "Grupos",
  round_of_32: "32-Avos",
  round_of_16: "Oitavas",
  quarter_finals: "Quartas",
  semi_finals: "Semis",
  third_place: "Terceiro",
  final: "Final",
};

/** Número de jogos em cada fase (estrutura oficial de 104 jogos da Copa 2026). */
export const GAMES_PER_PHASE: Record<Phase, number> = {
  group: 72,
  round_of_32: 16,
  round_of_16: 8,
  quarter_finals: 4,
  semi_finals: 2,
  third_place: 1,
  final: 1,
};

/** Fases de mata-mata (todas exceto a fase de grupos). */
export const KNOCKOUT_PHASES: ReadonlySet<Phase> = new Set<Phase>([
  "round_of_32",
  "round_of_16",
  "quarter_finals",
  "semi_finals",
  "third_place",
  "final",
]);
