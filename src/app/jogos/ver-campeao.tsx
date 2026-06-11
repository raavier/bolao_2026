"use client";

import { useState, useTransition } from "react";
import { Flag } from "@/components/flag";
import { verPalpitesCampeao, type PalpiteCampeaoDeTodos } from "./actions";

type State =
  | { kind: "idle" }
  | { kind: "open"; palpites: PalpiteCampeaoDeTodos[] }
  | { kind: "error"; message: string };

export function VerCampeao() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    if (state.kind === "open") {
      setState({ kind: "idle" });
      return;
    }
    startTransition(async () => {
      const result = await verPalpitesCampeao();
      setState(
        result.ok
          ? { kind: "open", palpites: result.palpites }
          : { kind: "error", message: result.error },
      );
    });
  };

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/15 p-3">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className="text-sm font-medium text-foreground/80 hover:text-foreground disabled:opacity-50"
      >
        🏆{" "}
        {isPending
          ? "Carregando…"
          : state.kind === "open"
            ? "Ocultar palpites de campeão"
            : "Ver palpites de campeão de todos"}
      </button>

      {state.kind === "error" ? (
        <p className="text-xs text-foreground/50 mt-1">{state.message}</p>
      ) : null}

      {state.kind === "open" ? (
        state.palpites.length === 0 ? (
          <p className="text-xs text-foreground/50 mt-2">
            Ninguém escolheu campeão.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {state.palpites.map((p) => (
              <li key={p.nome} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate text-foreground/70">
                  {p.nome}
                </span>
                <Flag team={p.selecao} />
                <span className="font-medium">{p.selecao}</span>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
