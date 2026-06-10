"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { BRACKET_MAP } from "@/lib/bracket";
import { ALL_TEAMS } from "@/lib/groups";

const resultadoSchema = z.object({
  jogoId: z.coerce.number().int().positive(),
  golsMandante: z.coerce.number().int().min(0).max(99),
  golsVisitante: z.coerce.number().int().min(0).max(99),
  // Quem avançou: "home" ou "away". Opcional (só faz sentido no mata-mata).
  avancou: z.enum(["home", "away"]).nullable().optional(),
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
  const avancouRaw = formData.get("avancou");
  const parsed = resultadoSchema.safeParse({
    jogoId: formData.get("jogoId"),
    golsMandante: formData.get("golsMandante"),
    golsVisitante: formData.get("golsVisitante"),
    avancou: avancouRaw === "" ? null : avancouRaw,
  });
  if (!parsed.success) return { ok: false, error: "Placar inválido." };

  const { jogoId, golsMandante, golsVisitante, avancou } = parsed.data;
  const { isAdmin, supabase } = await requireAdmin();
  if (!isAdmin) return { ok: false, error: "Apenas o admin pode lançar resultados." };

  // Lê os times do jogo (necessários para propagar quem avança).
  const { data: jogo } = await supabase
    .from("jogos")
    .select("mandante, visitante")
    .eq("id", jogoId)
    .single();
  if (!jogo) return { ok: false, error: "Jogo não encontrado." };

  const { error } = await supabase
    .from("jogos")
    .update({ gols_mandante: golsMandante, gols_visitante: golsVisitante, status: "encerrado" })
    .eq("id", jogoId);
  if (error) return { ok: false, error: "Não foi possível salvar." };

  // Propaga o vencedor (e, no caso da semi, o perdedor para a disputa de 3º)
  // para os jogos seguintes do chaveamento.
  const targets = BRACKET_MAP[jogoId];
  if (targets && avancou) {
    const vencedor = avancou === "home" ? jogo.mandante : jogo.visitante;
    const perdedor = avancou === "home" ? jogo.visitante : jogo.mandante;

    if (targets.W) {
      const patch =
        targets.W.slot === "home" ? { mandante: vencedor } : { visitante: vencedor };
      await supabase.from("jogos").update(patch).eq("id", targets.W.jogo);
    }
    if (targets.L) {
      const patch =
        targets.L.slot === "home" ? { mandante: perdedor } : { visitante: perdedor };
      await supabase.from("jogos").update(patch).eq("id", targets.L.jogo);
    }
  }

  revalidatePath("/admin/resultados");
  revalidatePath("/admin/mata-mata");
  revalidatePath("/ranking");
  revalidatePath("/jogos");
  return { ok: true };
}

const campeaoSchema = z.object({
  // Vazio = limpar o campeão; senão tem que ser uma das 48 seleções.
  selecao: z.union([z.literal(""), z.enum(ALL_TEAMS as [string, ...string[]])]),
});

export type CampeaoResult = { ok: true } | { ok: false; error: string };

/** Define (ou limpa) a seleção campeã oficial — dá os 40 pts a quem acertou. */
export async function salvarCampeao(
  _prev: CampeaoResult | null,
  formData: FormData,
): Promise<CampeaoResult> {
  const parsed = campeaoSchema.safeParse({ selecao: formData.get("selecao") });
  if (!parsed.success) return { ok: false, error: "Seleção inválida." };

  const { isAdmin, supabase } = await requireAdmin();
  if (!isAdmin) return { ok: false, error: "Apenas o admin pode definir o campeão." };

  const { error } = await supabase
    .from("bolao_config")
    .update({
      campeao: parsed.data.selecao === "" ? null : parsed.data.selecao,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/admin/resultados");
  revalidatePath("/ranking");
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
