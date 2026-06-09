import { PHASE_SHORT_LABELS, type Phase } from "@/lib/scoring/phases";

/** Chip pequeno indicando a fase da partida (Grupos, 32-Avos, ...). */
export function PhaseTag({ phase }: { phase: Phase }) {
  return (
    <span className="text-[10px] uppercase tracking-wide rounded-full bg-foreground/10 text-foreground/60 px-1.5 py-0.5">
      {PHASE_SHORT_LABELS[phase]}
    </span>
  );
}
