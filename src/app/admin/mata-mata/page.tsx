import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ALL_TEAMS } from "@/lib/groups";
import { PHASE_LABELS, type Phase } from "@/lib/scoring/phases";
import { ConfrontoForm } from "./confronto-form";

export const dynamic = "force-dynamic";

export default async function MataMataPage() {
  const { user, supabase } = await requireUser();

  const { data: me } = await supabase
    .from("participantes")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) redirect("/");

  const { data: jogos } = await supabase
    .from("jogos")
    .select("id, fase, mandante, visitante")
    .neq("fase", "group")
    .order("id", { ascending: true });

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Definir confrontos do mata-mata</h1>
        <p className="text-sm text-foreground/60">
          Quando a fase de grupos terminar, defina quem joga contra quem. Comece
          a digitar para escolher uma seleção, ou deixe o texto-placeholder.
          Confira a aba <strong>Grupos</strong> para a classificação.
        </p>
      </header>

      <div>
        {(jogos ?? []).map((jogo) => (
          <ConfrontoForm
            key={jogo.id}
            jogoId={jogo.id}
            faseLabel={PHASE_LABELS[jogo.fase as Phase]}
            mandante={jogo.mandante}
            visitante={jogo.visitante}
            times={ALL_TEAMS}
          />
        ))}
      </div>
    </div>
  );
}
