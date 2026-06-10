"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { isPredictionOpen } from "@/lib/palpites/lock";
import { ALL_TEAMS } from "@/lib/groups";

const palpiteSchema = z.object({
  jogoId: z.coerce.number().int().positive(),
  golsMandante: z.coerce.number().int().min(0).max(99),
  golsVisitante: z.coerce.number().int().min(0).max(99),
});

export type SavePalpiteResult =
  | { ok: true; golsMandante: number; golsVisitante: number }
  | { ok: false; error: string };

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
  return { ok: true, golsMandante, golsVisitante };
}

const campeaoSchema = z.object({
  // Só aceita uma das 48 seleções oficiais (evita gravar lixo via POST direto).
  selecao: z.enum(ALL_TEAMS as [string, ...string[]]),
});

export type SaveCampeaoResult =
  | { ok: true; selecao: string }
  | { ok: false; error: string };

/**
 * Salva (ou troca) o palpite de campeão do usuário. Fecha no apito do 1º jogo
 * (prazo global = menor `inicio`). O RLS reforça a mesma regra no banco.
 */
export async function saveCampeao(
  _prev: SaveCampeaoResult | null,
  formData: FormData,
): Promise<SaveCampeaoResult> {
  const parsed = campeaoSchema.safeParse({ selecao: formData.get("selecao") });
  if (!parsed.success) {
    return { ok: false, error: "Escolha uma seleção válida." };
  }

  const { user, supabase } = await requireUser();

  // Prazo = primeiro apito da Copa (menor inicio entre todos os jogos).
  const { data: primeiro } = await supabase
    .from("jogos")
    .select("inicio")
    .order("inicio", { ascending: true })
    .limit(1)
    .single();

  if (!primeiro) {
    return { ok: false, error: "Os jogos ainda não foram cadastrados." };
  }

  if (!isPredictionOpen(new Date(primeiro.inicio))) {
    return { ok: false, error: "A Copa já começou — palpite de campeão encerrado." };
  }

  const { error } = await supabase.from("palpite_campeao").upsert(
    {
      participante_id: user.id,
      selecao: parsed.data.selecao,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "participante_id" },
  );

  if (error) {
    return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/palpites");
  revalidatePath("/ranking");
  return { ok: true, selecao: parsed.data.selecao };
}
