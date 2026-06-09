"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

const toggleSchema = z.object({
  participanteId: z.string().uuid(),
  bloquear: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export async function setBlocked(formData: FormData): Promise<void> {
  const parsed = toggleSchema.safeParse({
    participanteId: formData.get("participanteId"),
    bloquear: formData.get("bloquear"),
  });
  if (!parsed.success) return;

  const { user, supabase } = await requireUser();

  // Confirma que quem chama é admin (a policy RLS também exige isso).
  const { data: me } = await supabase
    .from("participantes")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) return;

  // Evita o admin se autobloquear sem querer.
  if (parsed.data.participanteId === user.id) return;

  await supabase
    .from("participantes")
    .update({ bloqueado: parsed.data.bloquear })
    .eq("id", parsed.data.participanteId);

  revalidatePath("/admin");
}
