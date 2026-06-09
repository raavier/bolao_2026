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

export function PalpiteForm(props: PalpiteFormProps) {
  const [result, formAction, isPending] = useActionState<
    SavePalpiteResult | null,
    FormData
  >(savePalpite, null);

  const kickoff = new Date(props.kickoffIso).getTime();
  const [isOpen, setIsOpen] = useState(() => Date.now() < kickoff);

  // Agenda a trava do campo para o instante exato do apito, sem recarregar.
  // Como o estado inicial já considera o horário, aqui só lidamos com a
  // transição futura. setTimeout estoura acima de ~24,8 dias; jogos mais
  // distantes não precisam de timer nesta sessão.
  const MAX_TIMEOUT = 2_147_483_647;
  useEffect(() => {
    if (!isOpen) return;
    const restante = kickoff - Date.now();
    if (restante <= 0 || restante > MAX_TIMEOUT) return;
    const timer = setTimeout(() => setIsOpen(false), restante);
    return () => clearTimeout(timer);
  }, [isOpen, kickoff]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-1 border-b border-black/5 dark:border-white/10 py-3"
    >
      <span className="text-xs text-foreground/50">{props.inicioLabel}</span>
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
          defaultValue={props.palpiteMandante ?? ""}
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
          defaultValue={props.palpiteVisitante ?? ""}
          className={scoreInputClass}
        />
        <span className="flex-1 flex items-center gap-2 min-w-0">
          <Flag team={props.visitante} />
          <span className="truncate">{props.visitante}</span>
        </span>
      </div>
      <div className="flex justify-end mt-1">
        {isOpen ? (
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-foreground text-background px-4 py-1.5 text-xs font-medium disabled:opacity-60"
          >
            {isPending ? "…" : "Salvar"}
          </button>
        ) : (
          <span className="text-xs text-foreground/40">🔒 fechado</span>
        )}
      </div>
      {result?.ok === true ? (
        <span className="text-xs text-green-600">Palpite salvo.</span>
      ) : null}
      {result?.ok === false ? (
        <span className="text-xs text-red-600">{result.error}</span>
      ) : null}
    </form>
  );
}
