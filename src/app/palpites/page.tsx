import { requireUser } from "@/lib/auth";
import { PalpitesList, type JogoPalpite } from "./palpites-list";

export const dynamic = "force-dynamic";

export default async function PalpitesPage() {
  const { user, supabase } = await requireUser();

  const [{ data: jogos }, { data: palpites }] = await Promise.all([
    supabase
      .from("jogos")
      .select("id, fase, grupo, mandante, visitante, inicio")
      .order("inicio", { ascending: true }),
    supabase
      .from("palpites")
      .select("jogo_id, gols_mandante, gols_visitante")
      .eq("participante_id", user.id),
  ]);

  const palpitePorJogo = new Map((palpites ?? []).map((p) => [p.jogo_id, p]));

  const dados: JogoPalpite[] = (jogos ?? []).map((jogo) => {
    const palpite = palpitePorJogo.get(jogo.id);
    return {
      id: jogo.id,
      fase: jogo.fase,
      grupo: jogo.grupo,
      mandante: jogo.mandante,
      visitante: jogo.visitante,
      inicio: jogo.inicio,
      palpiteMandante: palpite?.gols_mandante ?? null,
      palpiteVisitante: palpite?.gols_visitante ?? null,
    };
  });

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Meus palpites</h1>
        <p className="text-sm text-foreground/60">
          O palpite pode ser editado até a hora exata do apito inicial de cada
          jogo. Depois disso, trava.
        </p>
      </header>

      {dados.length === 0 ? (
        <p className="text-foreground/60">Os jogos ainda não foram cadastrados.</p>
      ) : (
        <PalpitesList jogos={dados} />
      )}
    </div>
  );
}
