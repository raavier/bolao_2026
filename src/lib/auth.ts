import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Retorna o usuário autenticado ou redireciona para /login.
 * Usar no topo de Server Components/Actions que exigem login.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { user, supabase };
}
