"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

const resultadoSchema = z.object({
  jogoId: z.coerce.number().int().positive(),
  golsMandante: z.coerce.number().int().min(0).max(99),
  golsVisitante: z.coerce.number().int().min(0).max(99),
});

export type ResultadoResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const { user, supabase } = await requireUser();
  const { data: me } = await supabase
    .from("participantes")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return { isAdmin: Boolean(me?.is_admin), supabase };
}

/** Lança (ou corrige) o placar de um jogo e o marca como encerrado. */
export async function salvarResultado(
  _prev: ResultadoResult | null,
  formData: FormData,
): Promise<ResultadoResult> {
  const parsed = resultadoSchema.safeParse({
    jogoId: formData.get("jogoId"),
    golsMandante: formData.get("golsMandante"),
    golsVisitante: formData.get("golsVisitante"),
  });
  if (!parsed.success) return { ok: false, error: "Placar inválido." };

  const { isAdmin, supabase } = await requireAdmin();
  if (!isAdmin) return { ok: false, error: "Apenas o admin pode lançar resultados." };

  const { error } = await supabase
    .from("jogos")
    .update({
      gols_mandante: parsed.data.golsMandante,
      gols_visitante: parsed.data.golsVisitante,
      status: "encerrado",
    })
    .eq("id", parsed.data.jogoId);

  if (error) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/admin/resultados");
  revalidatePath("/ranking");
  revalidatePath("/jogos");
  return { ok: true };
}

/** Reabre um jogo: limpa o placar e volta para agendado (para correções). */
export async function reabrirJogo(formData: FormData): Promise<void> {
  const jogoId = z.coerce.number().int().positive().safeParse(formData.get("jogoId"));
  if (!jogoId.success) return;

  const { isAdmin, supabase } = await requireAdmin();
  if (!isAdmin) return;

  await supabase
    .from("jogos")
    .update({ gols_mandante: null, gols_visitante: null, status: "agendado" })
    .eq("id", jogoId.data);

  revalidatePath("/admin/resultados");
  revalidatePath("/ranking");
  revalidatePath("/jogos");
}
