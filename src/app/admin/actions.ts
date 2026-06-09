"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { OWNER_EMAIL } from "./owner";

const toggleSchema = z.object({
  participanteId: z.string().uuid(),
  bloquear: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const adminSchema = z.object({
  participanteId: z.string().uuid(),
  tornarAdmin: z.enum(["true", "false"]).transform((value) => value === "true"),
});

async function callerIsAdmin() {
  const { user, supabase } = await requireUser();
  const { data: me } = await supabase
    .from("participantes")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return { isAdmin: Boolean(me?.is_admin), user, supabase };
}

export async function setBlocked(formData: FormData): Promise<void> {
  const parsed = toggleSchema.safeParse({
    participanteId: formData.get("participanteId"),
    bloquear: formData.get("bloquear"),
  });
  if (!parsed.success) return;

  const { isAdmin, user, supabase } = await callerIsAdmin();
  if (!isAdmin) return;

  // Evita o admin se autobloquear sem querer.
  if (parsed.data.participanteId === user.id) return;

  await supabase
    .from("participantes")
    .update({ bloqueado: parsed.data.bloquear })
    .eq("id", parsed.data.participanteId);

  revalidatePath("/admin");
}

export async function setAdmin(formData: FormData): Promise<void> {
  const parsed = adminSchema.safeParse({
    participanteId: formData.get("participanteId"),
    tornarAdmin: formData.get("tornarAdmin"),
  });
  if (!parsed.success) return;

  const { isAdmin, supabase } = await callerIsAdmin();
  if (!isAdmin) return;

  // Lê o alvo: o dono do bolão nunca pode perder o admin.
  const { data: alvo } = await supabase
    .from("participantes")
    .select("email")
    .eq("id", parsed.data.participanteId)
    .single();
  if (!alvo) return;
  if (alvo.email === OWNER_EMAIL && !parsed.data.tornarAdmin) return;

  await supabase
    .from("participantes")
    .update({ is_admin: parsed.data.tornarAdmin })
    .eq("id", parsed.data.participanteId);

  revalidatePath("/admin");
}
