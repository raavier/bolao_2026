"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  jogoId: z.coerce.number().int().min(73).max(104),
  mandante: z.string().trim().min(1).max(40),
  visitante: z.string().trim().min(1).max(40),
});

export type DefinirConfrontoResult = { ok: true } | { ok: false; error: string };

export async function definirConfronto(
  _prev: DefinirConfrontoResult | null,
  formData: FormData,
): Promise<DefinirConfrontoResult> {
  const parsed = schema.safeParse({
    jogoId: formData.get("jogoId"),
    mandante: formData.get("mandante"),
    visitante: formData.get("visitante"),
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };
  if (parsed.data.mandante === parsed.data.visitante) {
    return { ok: false, error: "Os dois times não podem ser iguais." };
  }

  const { user, supabase } = await requireUser();
  const { data: me } = await supabase
    .from("participantes")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) return { ok: false, error: "Apenas o admin pode editar." };

  const { error } = await supabase
    .from("jogos")
    .update({ mandante: parsed.data.mandante, visitante: parsed.data.visitante })
    .eq("id", parsed.data.jogoId);

  if (error) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/admin/mata-mata");
  revalidatePath("/jogos");
  revalidatePath("/palpites");
  return { ok: true };
}
