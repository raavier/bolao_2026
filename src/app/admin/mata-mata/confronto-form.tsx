"use client";

import { useActionState } from "react";
import { definirConfronto, type DefinirConfrontoResult } from "./actions";

type ConfrontoFormProps = {
  jogoId: number;
  faseLabel: string;
  mandante: string;
  visitante: string;
  times: string[];
};

const inputClass =
  "flex-1 min-w-0 rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-base sm:text-sm";

export function ConfrontoForm(props: ConfrontoFormProps) {
  const [result, formAction, isPending] = useActionState<
    DefinirConfrontoResult | null,
    FormData
  >(definirConfronto, null);

  const listId = `times-${props.jogoId}`;

  return (
    <form action={formAction} className="border-b border-black/5 dark:border-white/10 py-3 space-y-1">
      <div className="flex items-center gap-1 text-xs text-foreground/50">
        <span>Jogo {props.jogoId}</span>
        <span>· {props.faseLabel}</span>
      </div>
      <input type="hidden" name="jogoId" value={props.jogoId} />
      <datalist id={listId}>
        {props.times.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          name="mandante"
          list={listId}
          defaultValue={props.mandante}
          required
          aria-label="Mandante"
          className={inputClass}
        />
        <span className="text-foreground/40 text-xs shrink-0 hidden sm:inline">×</span>
        <input
          name="visitante"
          list={listId}
          defaultValue={props.visitante}
          required
          aria-label="Visitante"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-foreground text-background px-4 py-1.5 text-xs font-medium disabled:opacity-60 shrink-0 w-full sm:w-auto"
        >
          {isPending ? "…" : "Salvar"}
        </button>
      </div>
      {result?.ok === true ? (
        <span className="text-xs text-green-600">Confronto salvo.</span>
      ) : null}
      {result?.ok === false ? (
        <span className="text-xs text-red-600">{result.error}</span>
      ) : null}
    </form>
  );
}
