"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

const nicknameSchema = z.string().trim().min(2, "Mínimo 2 caracteres.").max(20, "Máximo 20 caracteres.");

export type PerfilResult = { ok: true } | { ok: false; error: string };

export async function salvarNickname(
  _prev: PerfilResult | null,
  formData: FormData,
): Promise<PerfilResult> {
  const parsed = nicknameSchema.safeParse(formData.get("nickname"));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Apelido inválido." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("set_nickname", { novo: parsed.data });

  if (error) return { ok: false, error: "Não foi possível salvar o apelido." };

  revalidatePath("/perfil");
  revalidatePath("/ranking");
  return { ok: true };
}
