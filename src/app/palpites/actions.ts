"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { isPredictionOpen } from "@/lib/palpites/lock";

const palpiteSchema = z.object({
  jogoId: z.coerce.number().int().positive(),
  golsMandante: z.coerce.number().int().min(0).max(99),
  golsVisitante: z.coerce.number().int().min(0).max(99),
});

export type SavePalpiteResult = { ok: true } | { ok: false; error: string };

export async function savePalpite(
  _prev: SavePalpiteResult | null,
  formData: FormData,
): Promise<SavePalpiteResult> {
  const parsed = palpiteSchema.safeParse({
    jogoId: formData.get("jogoId"),
    golsMandante: formData.get("golsMandante"),
    golsVisitante: formData.get("golsVisitante"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Placar inválido." };
  }

  const { user, supabase } = await requireUser();
  const { jogoId, golsMandante, golsVisitante } = parsed.data;

  // Confere o lock no servidor: o palpite só vale até o apito inicial.
  const { data: jogo, error: jogoError } = await supabase
    .from("jogos")
    .select("inicio")
    .eq("id", jogoId)
    .single();

  if (jogoError || !jogo) {
    return { ok: false, error: "Jogo não encontrado." };
  }

  if (!isPredictionOpen(new Date(jogo.inicio))) {
    return { ok: false, error: "Este jogo já começou — palpite encerrado." };
  }

  // RLS reforça a mesma regra no banco.
  const { error } = await supabase.from("palpites").upsert(
    {
      participante_id: user.id,
      jogo_id: jogoId,
      gols_mandante: golsMandante,
      gols_visitante: golsVisitante,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "participante_id,jogo_id" },
  );

  if (error) {
    return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/palpites");
  return { ok: true };
}
