"use client";

import { useActionState } from "react";
import { Flag } from "@/components/flag";
import { ALL_TEAMS } from "@/lib/groups";
import { salvarCampeao, type CampeaoResult } from "./actions";

const selectClass =
  "rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-base sm:text-sm";

export function CampeaoAdminForm({ atual }: { atual: string | null }) {
  const [result, formAction, isPending] = useActionState<
    CampeaoResult | null,
    FormData
  >(salvarCampeao, null);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      {atual ? <Flag team={atual} className="w-8 h-5" /> : null}
      <select name="selecao" defaultValue={atual ?? ""} className={selectClass}>
        <option value="">— não definido —</option>
        {ALL_TEAMS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-foreground text-background px-4 py-1.5 text-sm font-medium disabled:opacity-60"
      >
        {isPending ? "…" : "Salvar campeão"}
      </button>
      {result?.ok === true ? (
        <span className="text-xs text-green-600">Campeão salvo.</span>
      ) : null}
      {result?.ok === false ? (
        <span className="text-xs text-red-600">{result.error}</span>
      ) : null}
    </form>
  );
}
