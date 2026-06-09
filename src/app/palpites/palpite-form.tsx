"use client";

import { useActionState, useEffect, useState } from "react";
import { Flag } from "@/components/flag";
import { savePalpite, type SavePalpiteResult } from "./actions";

type PalpiteFormProps = {
  jogoId: number;
  mandante: string;
  visitante: string;
  inicioLabel: string;
  kickoffIso: string;
  palpiteMandante: number | null;
  palpiteVisitante: number | null;
};

const scoreInputClass =
  "w-14 rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-center text-base sm:text-sm disabled:opacity-50";

const toText = (n: number | null) => (n === null ? "" : String(n));

export function PalpiteForm(props: PalpiteFormProps) {
  const [result, formAction, isPending] = useActionState<
    SavePalpiteResult | null,
    FormData
  >(savePalpite, null);

  const kickoff = new Date(props.kickoffIso).getTime();
  const [isOpen, setIsOpen] = useState(() => Date.now() < kickoff);

  // Valores atuais nos campos (o que a pessoa está digitando).
  const [campo, setCampo] = useState<{ home: string; away: string }>({
    home: toText(props.palpiteMandante),
    away: toText(props.palpiteVisitante),
  });

  // Valores que ESTÃO no banco: derivados sem efeito — se um save confirmou
  // nesta sessão, vale o resultado; senão, o que veio do servidor (persiste
  // após refresh, pois a prop vem do banco).
  const salvo = result?.ok
    ? { home: String(result.golsMandante), away: String(result.golsVisitante) }
    : { home: toText(props.palpiteMandante), away: toText(props.palpiteVisitante) };

  const MAX_TIMEOUT = 2_147_483_647;
  useEffect(() => {
    if (!isOpen) return;
    const restante = kickoff - Date.now();
    if (restante <= 0 || restante > MAX_TIMEOUT) return;
    const timer = setTimeout(() => setIsOpen(false), restante);
    return () => clearTimeout(timer);
  }, [isOpen, kickoff]);

  const temSalvo = salvo.home !== "" && salvo.away !== "";
  const campoIgualSalvo = campo.home === salvo.home && campo.away === salvo.away;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-1 border-b border-black/5 dark:border-white/10 py-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-foreground/50">{props.inicioLabel}</span>
        <StatusTag isOpen={isOpen} temSalvo={temSalvo} pendente={!campoIgualSalvo} />
      </div>
      <input type="hidden" name="jogoId" value={props.jogoId} />
      <div className="flex items-center gap-2 text-sm">
        <span className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span className="truncate">{props.mandante}</span>
          <Flag team={props.mandante} />
        </span>
        <input
          type="number"
          name="golsMandante"
          min={0}
          max={99}
          required
          disabled={!isOpen}
          value={campo.home}
          onChange={(e) => setCampo((c) => ({ ...c, home: e.target.value }))}
          className={scoreInputClass}
        />
        <span className="text-foreground/40">×</span>
        <input
          type="number"
          name="golsVisitante"
          min={0}
          max={99}
          required
          disabled={!isOpen}
          value={campo.away}
          onChange={(e) => setCampo((c) => ({ ...c, away: e.target.value }))}
          className={scoreInputClass}
        />
        <span className="flex-1 flex items-center gap-2 min-w-0">
          <Flag team={props.visitante} />
          <span className="truncate">{props.visitante}</span>
        </span>
      </div>
      {isOpen ? (
        <div className="flex justify-end mt-1">
          <button
            type="submit"
            disabled={isPending || campoIgualSalvo}
            className="rounded-md bg-foreground text-background px-4 py-1.5 text-xs font-medium disabled:opacity-40"
          >
            {isPending ? "…" : campoIgualSalvo && temSalvo ? "Salvo" : "Salvar"}
          </button>
        </div>
      ) : null}
      {result?.ok === false ? (
        <span className="text-xs text-red-600 text-right">{result.error}</span>
      ) : null}
    </form>
  );
}

function StatusTag({
  isOpen,
  temSalvo,
  pendente,
}: {
  isOpen: boolean;
  temSalvo: boolean;
  pendente: boolean;
}) {
  const base = "text-xs font-medium px-2 py-0.5 rounded-full";

  if (!isOpen) {
    return temSalvo ? (
      <span className={`${base} bg-green-600/15 text-green-700`}>✓ Palpite salvo</span>
    ) : (
      <span className={`${base} bg-foreground/10 text-foreground/50`}>🔒 Sem palpite</span>
    );
  }

  if (!temSalvo && pendente) {
    return <span className={`${base} text-amber-600`}>● Não salvo</span>;
  }
  if (!temSalvo) {
    return <span className={`${base} text-foreground/40`}>Em branco</span>;
  }
  if (pendente) {
    return <span className={`${base} text-amber-600`}>● Alterações não salvas</span>;
  }
  return <span className={`${base} bg-green-600/15 text-green-700`}>✓ Salvo</span>;
}
