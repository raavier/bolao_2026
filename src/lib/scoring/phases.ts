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

/** Fases de mata-mata (todas exceto a fase de grupos). */
export const KNOCKOUT_PHASES: ReadonlySet<Phase> = new Set<Phase>([
  "round_of_32",
  "round_of_16",
  "quarter_finals",
  "semi_finals",
  "third_place",
  "final",
]);
