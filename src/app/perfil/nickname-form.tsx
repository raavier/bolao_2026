"use client";

import { useActionState } from "react";
import { salvarNickname, type PerfilResult } from "./actions";

export function NicknameForm({ atual }: { atual: string }) {
  const [result, formAction, isPending] = useActionState<
    PerfilResult | null,
    FormData
  >(salvarNickname, null);

  return (
    <form action={formAction} className="space-y-3 max-w-sm">
      <label className="block text-sm font-medium" htmlFor="nickname">
        Seu apelido no bolão
      </label>
      <input
        id="nickname"
        name="nickname"
        type="text"
        required
        minLength={2}
        maxLength={20}
        defaultValue={atual}
        placeholder="Como você quer aparecer no ranking"
        className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-base sm:text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {isPending ? "Salvando…" : "Salvar apelido"}
      </button>
      {result?.ok === true ? (
        <p className="text-sm text-green-600">Apelido salvo!</p>
      ) : null}
      {result?.ok === false ? (
        <p className="text-sm text-red-600">{result.error}</p>
      ) : null}
    </form>
  );
}
