import { createClient } from "@/lib/supabase/server";
import { loadScoringConfig } from "@/lib/scoring/load-config";
import { computeRanking } from "@/lib/scoring/ranking";
import { displayName } from "@/lib/display-name";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const supabase = await createClient();
  const config = loadScoringConfig();

  const [{ data: participantes }, { data: jogos }] = await Promise.all([
    supabase.from("participantes").select("id, nome, nickname"),
    supabase
      .from("jogos")
      .select("id, fase, gols_mandante, gols_visitante")
      .eq("status", "encerrado"),
  ]);

  const jogosEncerrados = (jogos ?? []).filter(
    (j) => j.gols_mandante !== null && j.gols_visitante !== null,
  );
  const jogoIds = jogosEncerrados.map((j) => j.id);

  const { data: palpites } = jogoIds.length
    ? await supabase
        .from("palpites")
        .select("participante_id, jogo_id, gols_mandante, gols_visitante")
        .in("jogo_id", jogoIds)
    : { data: [] };

  const ranking = computeRanking(
    (participantes ?? []).map((p) => ({ id: p.id, nome: displayName(p) })),
    jogosEncerrados.map((j) => ({
      id: j.id,
      phase: j.fase,
      golsMandante: j.gols_mandante as number,
      golsVisitante: j.gols_visitante as number,
    })),
    (palpites ?? []).map((p) => ({
      participanteId: p.participante_id,
      jogoId: p.jogo_id,
      golsMandante: p.gols_mandante,
      golsVisitante: p.gols_visitante,
    })),
    config,
  );

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-sm text-foreground/60">
          {jogosEncerrados.length === 0
            ? "Ainda não há jogos encerrados. O ranking aparece quando os resultados começarem."
            : `Baseado em ${jogosEncerrados.length} jogo(s) encerrado(s).`}
        </p>
      </header>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b border-black/10 dark:border-white/15">
            <th className="py-2 w-8">#</th>
            <th className="py-2">Participante</th>
            <th className="py-2 text-right">Pontos</th>
            <th className="py-2 text-right" title="Placares cravados">🎯</th>
            <th className="py-2 text-right" title="Resultados certos">✅</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((row, index) => (
            <tr key={row.id} className="border-b border-black/5 dark:border-white/10">
              <td className="py-2 text-foreground/50">{index + 1}</td>
              <td className="py-2 font-medium">{row.nome}</td>
              <td className="py-2 text-right font-semibold">{row.points}</td>
              <td className="py-2 text-right text-foreground/60">{row.exactScores}</td>
              <td className="py-2 text-right text-foreground/60">{row.correctResults}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
