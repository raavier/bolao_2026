"use client";

import { useState, useTransition } from "react";
import { verPalpitesDoJogo, type PalpiteDeTodos } from "./actions";
import { CompartilharPalpites } from "./compartilhar-palpites";
import type { ShareJogo } from "@/lib/jogos/share-text";

type VerPalpitesProps = {
  jogoId: number;
  jogo: ShareJogo;
};

type State =
  | { kind: "idle" }
  | { kind: "open"; palpites: PalpiteDeTodos[] }
  | { kind: "error"; message: string };

export function VerPalpites({ jogoId, jogo }: VerPalpitesProps) {
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
          <div>
            <div className="mt-2 rounded-md border border-foreground/10 overflow-hidden">
              {state.palpites.map((p, i) => (
                <div
                  key={p.nome}
                  className={`flex items-center px-2.5 py-1.5 text-xs transition-colors hover:bg-foreground/8 ${
                    i % 2 === 1 ? "bg-black/[0.03] dark:bg-white/[0.04]" : ""
                  }`}
                >
                  <span className="truncate text-foreground/80">{p.nome}</span>
                  <span className="flex-1 mx-1.5 border-b border-dotted border-foreground/20 min-w-4" />
                  <span className="font-medium tabular-nums bg-foreground/[0.07] rounded px-1.5 py-0.5">
                    {p.golsMandante} × {p.golsVisitante}
                  </span>
                </div>
              ))}
            </div>
            <CompartilharPalpites jogo={jogo} palpites={state.palpites} />
          </div>
        )
      ) : null}
    </div>
  );
}
