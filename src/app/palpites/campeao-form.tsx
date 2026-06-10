"use client";

import { useActionState, useEffect, useState } from "react";
import { Flag } from "@/components/flag";
import { ALL_TEAMS } from "@/lib/groups";
import { saveCampeao, type SaveCampeaoResult } from "./actions";

type CampeaoFormProps = {
  /** Seleção já salva no banco (null se ainda não palpitou). */
  campeaoSalvo: string | null;
  /** Apito do 1º jogo (ISO). null se não há jogos cadastrados. */
  primeiroApitoIso: string | null;
};

const selectClass =
  "rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-base sm:text-sm disabled:opacity-50";

export function CampeaoForm(props: CampeaoFormProps) {
  const [result, formAction, isPending] = useActionState<
    SaveCampeaoResult | null,
    FormData
  >(saveCampeao, null);

  const kickoff = props.primeiroApitoIso
    ? new Date(props.primeiroApitoIso).getTime()
    : null;
  const [isOpen, setIsOpen] = useState(() =>
    kickoff === null ? false : Date.now() < kickoff,
  );

  // Valor que ESTÁ no banco: se um save confirmou nesta sessão, vale ele;
  // senão o que veio do servidor (persiste após refresh).
  const salvo = result?.ok ? result.selecao : props.campeaoSalvo;

  // Valor atual no campo (o que a pessoa está escolhendo).
  const [campo, setCampo] = useState<string>(salvo ?? "");

  // Trava automaticamente ao chegar o apito do 1º jogo (sem reload).
  const MAX_TIMEOUT = 2_147_483_647;
  useEffect(() => {
    if (!isOpen || kickoff === null) return;
    const restante = kickoff - Date.now();
    if (restante <= 0 || restante > MAX_TIMEOUT) return;
    const timer = setTimeout(() => setIsOpen(false), restante);
    return () => clearTimeout(timer);
  }, [isOpen, kickoff]);

  const temSalvo = salvo !== null && salvo !== "";
  const campoIgualSalvo = campo === (salvo ?? "");

  return (
    <section className="rounded-lg border border-black/10 dark:border-white/15 bg-foreground/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">🏆 Campeão da Copa</h2>
        <StatusTag isOpen={isOpen} temSalvo={temSalvo} pendente={!campoIgualSalvo} />
      </div>
      <p className="text-sm text-foreground/60">
        Escolha a seleção campeã. Vale 40 pontos se acertar. Este palpite fecha
        no apito do primeiro jogo da Copa.
      </p>

      {isOpen ? (
        <form action={formAction} className="flex flex-wrap items-center gap-3">
          {campo ? <Flag team={campo} className="w-8 h-5" /> : null}
          <select
            name="selecao"
            required
            value={campo}
            onChange={(e) => setCampo(e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              Selecione…
            </option>
            {ALL_TEAMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isPending || campo === "" || campoIgualSalvo}
            className="rounded-md bg-foreground text-background px-4 py-1.5 text-sm font-medium disabled:opacity-40"
          >
            {isPending ? "…" : campoIgualSalvo && temSalvo ? "Salvo" : "Salvar"}
          </button>
        </form>
      ) : (
        <p className="flex items-center gap-2 text-sm">
          {temSalvo ? (
            <>
              <Flag team={salvo!} className="w-8 h-5" />
              <span className="font-medium">{salvo}</span>
            </>
          ) : (
            <span className="text-foreground/50">Você não palpitou o campeão.</span>
          )}
        </p>
      )}

      {result?.ok === false ? (
        <span className="text-xs text-red-600">{result.error}</span>
      ) : null}
    </section>
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
