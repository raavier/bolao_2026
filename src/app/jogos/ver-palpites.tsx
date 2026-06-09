"use client";

import { useState, useTransition } from "react";
import { verPalpitesDoJogo, type PalpiteDeTodos } from "./actions";

type VerPalpitesProps = {
  jogoId: number;
};

type State =
  | { kind: "idle" }
  | { kind: "open"; palpites: PalpiteDeTodos[] }
  | { kind: "error"; message: string };

export function VerPalpites({ jogoId }: VerPalpitesProps) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    if (state.kind === "open") {
      setState({ kind: "idle" });
      return;
    }
    startTransition(async () => {
      const result = await verPalpitesDoJogo(jogoId);
      setState(
        result.ok
          ? { kind: "open", palpites: result.palpites }
          : { kind: "error", message: result.error },
      );
    });
  };

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className="text-xs text-foreground/60 hover:text-foreground underline underline-offset-2 disabled:opacity-50"
      >
        {isPending
          ? "Carregando…"
          : state.kind === "open"
            ? "Ocultar palpites"
            : "Ver palpites de todos"}
      </button>

      {state.kind === "error" ? (
        <p className="text-xs text-foreground/50 mt-1">{state.message}</p>
      ) : null}

      {state.kind === "open" ? (
        state.palpites.length === 0 ? (
          <p className="text-xs text-foreground/50 mt-1">Ninguém palpitou neste jogo.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {state.palpites.map((p) => (
              <li key={p.nome} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate text-foreground/70">{p.nome}</span>
                <span className="font-medium tabular-nums">
                  {p.golsMandante} × {p.golsVisitante}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
