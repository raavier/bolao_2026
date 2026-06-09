"use client";

import { useActionState } from "react";
import { Flag } from "@/components/flag";
import { salvarResultado, reabrirJogo, type ResultadoResult } from "./actions";

type ResultadoFormProps = {
  jogoId: number;
  mandante: string;
  visitante: string;
  inicioLabel: string;
  golsMandante: number | null;
  golsVisitante: number | null;
  encerrado: boolean;
  /** true para jogos de mata-mata — mostra o seletor de quem avançou. */
  isKnockout: boolean;
};

const scoreInputClass =
  "w-12 rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-center text-sm";

export function ResultadoForm(props: ResultadoFormProps) {
  const [result, formAction, isPending] = useActionState<
    ResultadoResult | null,
    FormData
  >(salvarResultado, null);

  const botaoLabel = isPending ? "…" : props.encerrado ? "Atualizar" : "Encerrar";

  return (
    <div className="border-b border-black/5 dark:border-white/10 py-3">
      <div className="flex items-center gap-1 text-xs text-foreground/50">
        <span>{props.inicioLabel}</span>
        {props.encerrado ? <span className="text-green-600">· encerrado</span> : null}
      </div>

      <form action={formAction} className="mt-1 space-y-2">
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
            defaultValue={props.golsMandante ?? ""}
            className={scoreInputClass}
          />
          <span className="text-foreground/40">×</span>
          <input
            type="number"
            name="golsVisitante"
            min={0}
            max={99}
            required
            defaultValue={props.golsVisitante ?? ""}
            className={scoreInputClass}
          />
          <span className="flex-1 flex items-center gap-2 min-w-0">
            <Flag team={props.visitante} />
            <span className="truncate">{props.visitante}</span>
          </span>
          {props.isKnockout ? null : (
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-foreground text-background px-3 py-1 text-xs font-medium disabled:opacity-60"
            >
              {botaoLabel}
            </button>
          )}
        </div>

        {props.isKnockout ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-foreground/50">Quem avançou:</span>
            <select
              name="avancou"
              defaultValue=""
              className="rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1"
            >
              <option value="">—</option>
              <option value="home">{props.mandante}</option>
              <option value="away">{props.visitante}</option>
            </select>
            <span className="text-foreground/40 hidden sm:inline">(preenche o próximo jogo)</span>
            <button
              type="submit"
              disabled={isPending}
              className="ml-auto rounded-md bg-foreground text-background px-3 py-1 font-medium disabled:opacity-60"
            >
              {botaoLabel}
            </button>
          </div>
        ) : null}
      </form>

      <div className="flex items-center gap-3 mt-1 min-h-4">
        {result?.ok === true ? (
          <span className="text-xs text-green-600">Resultado salvo.</span>
        ) : null}
        {result?.ok === false ? (
          <span className="text-xs text-red-600">{result.error}</span>
        ) : null}
        {props.encerrado ? (
          <form action={reabrirJogo}>
            <input type="hidden" name="jogoId" value={props.jogoId} />
            <button
              type="submit"
              className="text-xs text-foreground/50 hover:text-foreground underline underline-offset-2"
            >
              Reabrir (limpar placar)
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
